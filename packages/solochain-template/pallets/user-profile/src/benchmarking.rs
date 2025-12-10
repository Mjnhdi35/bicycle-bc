#![cfg(feature = "runtime-benchmarks")]

use super::*;
use frame_benchmarking::{account, benchmarks, whitelisted_caller};
use frame_system::RawOrigin;

const SEED: u32 = 0;

benchmarks! {
    set_username {
        let caller: T::AccountId = whitelisted_caller();
        let username = b"testuser".to_vec();
    }: _(RawOrigin::Signed(caller.clone()), username)
    verify {
        assert!(Profiles::<T>::contains_key(&caller));
    }

    update_profile {
        let caller: T::AccountId = account("caller", 0, SEED);
        let username = b"testuser".to_vec();
        let username_bounded: BoundedVec<u8, <T as Config>::MaxUsernameLength> = username.try_into().unwrap();
        // Create profile first
        Profiles::<T>::insert(&caller, pallet::UserProfile {
            account: caller.clone(),
            username: username_bounded.clone(),
            avatar: None,
            bio: None,
            created_at: 1,
        });
        UsernameToAccount::<T>::insert(&username_bounded, &caller);
        let new_username = b"newuser".to_vec();
        let new_bio = b"My bio".to_vec();
    }: _(RawOrigin::Signed(caller.clone()), Some(new_username), None, Some(Some(new_bio)))
    verify {
        let profile = Profiles::<T>::get(&caller).unwrap();
        assert_eq!(profile.username, b"newuser".to_vec().try_into().unwrap());
    }

    update_stats {
        let caller: T::AccountId = account("caller", 0, SEED);
        // No need to create profile, stats can be updated independently
        UserStatsMap::<T>::insert(&caller, UserStats::default());
    }: _(RawOrigin::Signed(caller.clone()), Some(10), Some(5), Some(1000), Some(5000))
    verify {
        let stats = UserStatsMap::<T>::get(&caller).unwrap();
        assert_eq!(stats.total_races, 10);
    }
}

impl_benchmark_test_suite!(Pallet, crate::mock::new_test_ext(), crate::mock::Test);
