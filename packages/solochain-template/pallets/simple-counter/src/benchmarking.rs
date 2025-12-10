#![cfg(feature = "runtime-benchmarks")]

use super::*;
use frame_benchmarking::{account, benchmarks, whitelisted_caller};
use frame_system::RawOrigin;

const SEED: u32 = 0;

benchmarks! {
    increment {
        let caller: T::AccountId = whitelisted_caller();
    }: _(RawOrigin::Signed(caller.clone()))
    verify {
        let val = Counter::<T>::get();
        assert!(val >= 1);
    }

    reset {
        let caller: T::AccountId = account("caller", 0, SEED);
        Counter::<T>::put(5u64);
    }: _(RawOrigin::Signed(caller.clone()))
    verify {
        assert_eq!(Counter::<T>::get(), 0);
    }
}

impl_benchmark_test_suite!(Pallet, crate::mock::new_test_ext(), crate::mock::Test);
