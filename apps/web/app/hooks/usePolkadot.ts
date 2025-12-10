'use client';

import { useState, useEffect } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

// Dynamic import for extension-dapp to avoid SSR issues
let web3Accounts: any;
let web3Enable: any;
let web3FromAddress: any;

if (typeof window !== 'undefined') {
    import('@polkadot/extension-dapp').then((module) => {
        web3Accounts = module.web3Accounts;
        web3Enable = module.web3Enable;
        web3FromAddress = module.web3FromAddress;
    });
}

interface Account {
    address: string;
    meta: {
        name?: string;
        source: string;
    };
}

export function usePolkadot() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [api, setApi] = useState<ApiPromise | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsUrl = process.env.NEXT_PUBLIC_SUBSTRATE_WS_URL || 'ws://localhost:9944';

    useEffect(() => {
        // Initialize API connection
        const initApi = async () => {
            try {
                const provider = new WsProvider(wsUrl);
                const apiInstance = await ApiPromise.create({ provider });
                setApi(apiInstance);
            } catch (err: any) {
                setError(`Failed to connect to Substrate node: ${err.message}`);
            }
        };

        initApi();

        return () => {
            if (api) {
                api.disconnect();
            }
        };
    }, []);

    const connectWallet = async () => {
        if (typeof window === 'undefined') {
            setError('Wallet connection is only available in browser');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Ensure extension module is loaded
            if (!web3Enable) {
                const module = await import('@polkadot/extension-dapp');
                web3Enable = module.web3Enable;
                web3Accounts = module.web3Accounts;
                web3FromAddress = module.web3FromAddress;
            }

            // Request access to extension
            const extensions = await web3Enable('Bicyverse');

            if (extensions.length === 0) {
                throw new Error('No Polkadot extension found. Please install Polkadot.js extension.');
            }

            // Get accounts
            const allAccounts = await web3Accounts();
            setAccounts(allAccounts);

            if (allAccounts.length > 0) {
                setSelectedAccount(allAccounts[0]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    const signAndSend = async (
        extrinsic: any,
        callback?: (status: any) => void,
    ) => {
        if (typeof window === 'undefined') {
            throw new Error('Transaction signing is only available in browser');
        }

        if (!selectedAccount || !api) {
            throw new Error('No account selected or API not connected');
        }

        try {
            // Ensure extension module is loaded
            if (!web3FromAddress) {
                const module = await import('@polkadot/extension-dapp');
                web3FromAddress = module.web3FromAddress;
            }

            // Get injector for signing
            const injector = await web3FromAddress(selectedAccount.address);

            // Sign and send
            await extrinsic.signAndSend(
                selectedAccount.address,
                { signer: injector.signer },
                callback,
            );
        } catch (err: any) {
            throw new Error(`Transaction failed: ${err.message}`);
        }
    };

    return {
        accounts,
        selectedAccount,
        setSelectedAccount,
        api,
        isConnecting,
        error,
        connectWallet,
        signAndSend,
        isConnected: accounts.length > 0,
    };
}

