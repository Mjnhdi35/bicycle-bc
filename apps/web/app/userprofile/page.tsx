'use client';

import { useState, useEffect } from 'react';
import { usePolkadot } from '../hooks/usePolkadot';
import { ApiPromise } from '@polkadot/api';

// Component to display account balance
function AccountBalance({ api, address }: { api: ApiPromise; address: string }) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const accountInfo = await api.query.system.account(address);
        if (accountInfo) {
          const free = (accountInfo as any).data.free;
          setBalance(free.toHuman());
        }
      } catch (err) {
        console.error('Failed to load balance', err);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
    const interval = setInterval(loadBalance, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [api, address]);

  if (loading) return <p className="text-xs text-gray-400">Loading balance...</p>;
  if (!balance) return null;

  const balanceNum = parseFloat(balance.replace(/,/g, ''));
  const isLowBalance = balanceNum < 0.1;

  return (
    <div className={`text-xs ${isLowBalance ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
      Balance: {balance} {isLowBalance && '⚠️ Low balance! Transfer tokens from Alice account.'}
    </div>
  );
}

export default function UserProfilePage() {
  const {
    accounts,
    selectedAccount,
    setSelectedAccount,
    api,
    isConnecting,
    error,
    connectWallet,
    signAndSend,
    isConnected,
  } = usePolkadot();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccount && api) {
      loadProfile();
    }
  }, [selectedAccount, api]);

  const loadProfile = async () => {
    if (!selectedAccount || !api) return;

    try {
      setLoading(true);
      // Query profile from blockchain
      const profileData = await api.query.userProfile.profiles(selectedAccount.address);

      if (profileData && (profileData as any).isSome) {
        const profileValue = (profileData as any).unwrap();
        setProfile({
          username: profileValue.username?.toHuman() || null,
          avatar: profileValue.avatar?.toHuman() || null,
          bio: profileValue.bio?.toHuman() || null,
          createdAt: profileValue.createdAt?.toNumber() || 0,
        });
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetUsername = async () => {
    if (!selectedAccount || !api || !username.trim()) {
      alert('Please connect wallet and enter username');
      return;
    }

    try {
      setTxStatus('Preparing transaction...');

      // Create extrinsic
      const extrinsic = api.tx.userProfile.setUsername(api.createType('Vec<u8>', username));

      await signAndSend(extrinsic, (result) => {
        if (result.status.isInBlock) {
          setTxStatus(`Transaction included in block ${result.status.asInBlock}`);
          setTimeout(() => {
            loadProfile();
            setTxStatus(null);
          }, 2000);
        } else if (result.status.isFinalized) {
          setTxStatus(`Transaction finalized in block ${result.status.asFinalized}`);
        } else if (result.isError) {
          setTxStatus(`Transaction failed: ${result.status}`);
        }
      });
    } catch (err: any) {
      setTxStatus(`Error: ${err.message}`);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedAccount || !api) {
      alert('Please connect wallet');
      return;
    }

    try {
      setTxStatus('Preparing transaction...');

      const usernameParam = username.trim()
        ? api.createType('Option<Vec<u8>>', username)
        : api.createType('Option<Vec<u8>>', null);

      const avatarParam = avatar.trim()
        ? api.createType('Option<Option<Vec<u8>>>', avatar)
        : api.createType('Option<Option<Vec<u8>>>', null);

      const bioParam = bio.trim()
        ? api.createType('Option<Option<Vec<u8>>>', bio)
        : api.createType('Option<Option<Vec<u8>>>', null);

      const extrinsic = api.tx.userProfile.updateProfile(usernameParam, avatarParam, bioParam);

      await signAndSend(extrinsic, (result) => {
        if (result.status.isInBlock) {
          setTxStatus(`Transaction included in block ${result.status.asInBlock}`);
          setTimeout(() => {
            loadProfile();
            setTxStatus(null);
            setUsername('');
            setBio('');
            setAvatar('');
          }, 2000);
        } else if (result.status.isFinalized) {
          setTxStatus(`Transaction finalized in block ${result.status.asFinalized}`);
        } else if (result.isError) {
          setTxStatus(`Transaction failed: ${result.status}`);
        }
      });
    } catch (err: any) {
      setTxStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">UserProfile with MetaMask/Polkadot.js</h1>

      {/* Wallet Connection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
        {!isConnected ? (
          <div>
            <p className="mb-4 text-gray-600">
              Connect your Polkadot.js extension wallet to interact with the blockchain.
            </p>
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Cần có balance để submit transactions!</p>
              <p className="text-xs text-yellow-700">
                Nếu chưa có balance, hãy transfer token từ Alice account trên Polkadot.js Apps. Xem hướng dẫn trong{' '}
                <code className="bg-yellow-100 px-1 rounded">docs/QUICK_START.md</code>
              </p>
            </div>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-gray-600">Connected Account:</p>
            <select
              value={selectedAccount?.address || ''}
              onChange={(e) => {
                const account = accounts.find((a) => a.address === e.target.value);
                setSelectedAccount(account || null);
              }}
              className="w-full px-4 py-2 border rounded-md mb-2"
            >
              {accounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {account.meta.name || 'Unknown'} ({account.address.slice(0, 10)}...)
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 font-mono mb-2">{selectedAccount?.address}</p>
            {api && selectedAccount && <AccountBalance api={api} address={selectedAccount.address} />}
          </div>
        )}
        {error && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      </div>

      {/* Current Profile */}
      {profile && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Profile</h2>
          <div className="space-y-2">
            <p>
              <strong>Username:</strong> {profile.username || '-'}
            </p>
            <p>
              <strong>Avatar:</strong> {profile.avatar || '-'}
            </p>
            <p>
              <strong>Bio:</strong> {profile.bio || '-'}
            </p>
            <p>
              <strong>Created at block:</strong> {profile.createdAt}
            </p>
          </div>
        </div>
      )}

      {/* Set Username */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Set Username</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="alice"
              maxLength={32}
            />
          </div>
          <button
            onClick={handleSetUsername}
            disabled={!isConnected || !username.trim()}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Set Username
          </button>
        </div>
      </div>

      {/* Update Profile */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Update Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="alice"
              maxLength={32}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Avatar URL</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="https://example.com/avatar.png"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="About me..."
              maxLength={256}
              rows={3}
            />
          </div>
          <button
            onClick={handleUpdateProfile}
            disabled={!isConnected}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Update Profile
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {txStatus && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">{txStatus}</div>
      )}
    </div>
  );
}
