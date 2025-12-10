#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;
#[cfg(test)]
mod mock;
#[cfg(test)]
mod tests;
pub mod weights;
pub use weights::*;

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::{pallet_prelude::*, sp_runtime::traits::SaturatedConversion, traits::Get};
    use frame_system::pallet_prelude::*;
    use scale_info::TypeInfo;
    #[cfg(not(feature = "std"))]
    use sp_std::vec::Vec;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type WeightInfo: WeightInfo;
        /// Maximum length of username
        #[pallet::constant]
        type MaxUsernameLength: Get<u32>;
        /// Maximum length of bio
        #[pallet::constant]
        type MaxBioLength: Get<u32>;
    }

    /// User profile information
    #[derive(Clone, Encode, Decode, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(UsernameLimit, BioLimit))]
    pub struct UserProfile<AccountId, UsernameLimit: Get<u32>, BioLimit: Get<u32>> {
        pub account: AccountId,
        pub username: BoundedVec<u8, UsernameLimit>,
        pub avatar: Option<BoundedVec<u8, UsernameLimit>>,
        pub bio: Option<BoundedVec<u8, BioLimit>>,
        pub created_at: u64,
    }

    /// User statistics
    #[derive(
        Clone, Encode, Decode, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default,
    )]
    pub struct UserStats {
        pub total_races: u32,
        pub wins: u32,
        pub total_distance: u64,
        pub total_rewards: u128,
    }

    #[pallet::storage]
    pub type Profiles<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        UserProfile<T::AccountId, <T as Config>::MaxUsernameLength, <T as Config>::MaxBioLength>,
    >;

    /// Map from AccountId to UserStats
    #[pallet::storage]
    pub type UserStatsMap<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, UserStats>;

    /// Map from username to AccountId (for lookup)
    #[pallet::storage]
    pub type UsernameToAccount<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        BoundedVec<u8, <T as Config>::MaxUsernameLength>,
        T::AccountId,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Username set for the first time (profile created)
        UsernameSet {
            account: T::AccountId,
            username: BoundedVec<u8, <T as Config>::MaxUsernameLength>,
        },
        /// User profile updated
        ProfileUpdated {
            account: T::AccountId,
            username: Option<BoundedVec<u8, <T as Config>::MaxUsernameLength>>,
            avatar: Option<Option<BoundedVec<u8, <T as Config>::MaxUsernameLength>>>,
            bio: Option<Option<BoundedVec<u8, <T as Config>::MaxBioLength>>>,
        },
        /// User stats updated
        StatsUpdated {
            account: T::AccountId,
            total_races: u32,
            wins: u32,
            total_distance: u64,
            total_rewards: u128,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Username already taken
        UsernameTaken,
        /// Username too long
        UsernameTooLong,
        /// Bio too long
        BioTooLong,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Set username for the account (AccountId from frame_system)
        /// Creates profile automatically if it doesn't exist
        /// Account is automatically created by frame_system on first transaction
        #[pallet::call_index(0)]
        #[pallet::weight(T::WeightInfo::set_username())]
        pub fn set_username(origin: OriginFor<T>, username: Vec<u8>) -> DispatchResult {
            let who = ensure_signed(origin)?;

            // Validate username length
            let username_bounded =
                BoundedVec::try_from(username.clone()).map_err(|_| Error::<T>::UsernameTooLong)?;

            // Check if username is already taken
            if let Some(existing_account) = UsernameToAccount::<T>::get(&username_bounded) {
                ensure!(existing_account == who, Error::<T>::UsernameTaken);
            }

            // Get or create profile
            let created_at = if let Some(existing_profile) = Profiles::<T>::get(&who) {
                // Remove old username mapping if exists
                UsernameToAccount::<T>::remove(&existing_profile.username);
                existing_profile.created_at
            } else {
                // Create new profile
                let block_number = <frame_system::Pallet<T>>::block_number();
                UserStatsMap::<T>::insert(&who, UserStats::default());
                block_number.saturated_into::<u64>()
            };

            // Create/update profile
            let profile = UserProfile {
                account: who.clone(),
                username: username_bounded.clone(),
                avatar: None,
                bio: None,
                created_at,
            };

            // Store profile and username mapping
            Profiles::<T>::insert(&who, profile);
            UsernameToAccount::<T>::insert(&username_bounded, &who);

            Self::deposit_event(Event::UsernameSet {
                account: who,
                username: username_bounded,
            });

            Ok(())
        }

        /// Update user profile
        /// Creates profile automatically if it doesn't exist
        #[pallet::call_index(1)]
        #[pallet::weight(T::WeightInfo::update_profile())]
        pub fn update_profile(
            origin: OriginFor<T>,
            username: Option<Vec<u8>>,
            avatar: Option<Option<Vec<u8>>>,
            bio: Option<Option<Vec<u8>>>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            // Get or create profile
            let block_number = <frame_system::Pallet<T>>::block_number();
            let mut profile = Profiles::<T>::get(&who).unwrap_or_else(|| UserProfile {
                account: who.clone(),
                username: BoundedVec::default(),
                avatar: None,
                bio: None,
                created_at: block_number.saturated_into::<u64>(),
            });

            // Initialize stats if profile is new
            if !UserStatsMap::<T>::contains_key(&who) {
                UserStatsMap::<T>::insert(&who, UserStats::default());
            }

            // Clone for event emission (before any moves)
            let username_for_event = username.as_ref().map(|u| u.clone());
            let avatar_for_event = avatar.as_ref().map(|a| a.as_ref().map(|v| v.clone()));
            let bio_for_event = bio.as_ref().map(|b| b.as_ref().map(|v| v.clone()));

            // Update username if provided
            if let Some(new_username) = username {
                let username_bounded = BoundedVec::try_from(new_username.clone())
                    .map_err(|_| Error::<T>::UsernameTooLong)?;

                // Check if new username is already taken (by someone else)
                if let Some(existing_account) = UsernameToAccount::<T>::get(&username_bounded) {
                    if existing_account != who {
                        return Err(Error::<T>::UsernameTaken.into());
                    }
                }

                // Remove old username mapping
                UsernameToAccount::<T>::remove(&profile.username);

                // Update username
                profile.username = username_bounded.clone();
                UsernameToAccount::<T>::insert(&username_bounded, &who);
            }

            // Update avatar if provided
            if let Some(avatar_option) = avatar {
                profile.avatar = avatar_option
                    .map(|v| BoundedVec::try_from(v).map_err(|_| Error::<T>::UsernameTooLong))
                    .transpose()?;
            }

            // Update bio if provided
            if let Some(bio_option) = bio {
                profile.bio = bio_option
                    .map(|v| BoundedVec::try_from(v).map_err(|_| Error::<T>::BioTooLong))
                    .transpose()?;
            }

            // Store updated profile
            Profiles::<T>::insert(&who, profile);

            Self::deposit_event(Event::ProfileUpdated {
                account: who,
                username: username_for_event.map(|u| BoundedVec::try_from(u).unwrap_or_default()),
                avatar: avatar_for_event
                    .map(|a| a.map(|v| BoundedVec::try_from(v).unwrap_or_default())),
                bio: bio_for_event.map(|b| b.map(|v| BoundedVec::try_from(v).unwrap_or_default())),
            });

            Ok(())
        }

        /// Update user statistics (typically called by other pallets)
        /// AccountId is from frame_system, no need to check if account exists
        #[pallet::call_index(2)]
        #[pallet::weight(T::WeightInfo::update_stats())]
        pub fn update_stats(
            origin: OriginFor<T>,
            total_races: Option<u32>,
            wins: Option<u32>,
            total_distance: Option<u64>,
            total_rewards: Option<u128>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            // Get current stats or default
            let mut stats = UserStatsMap::<T>::get(&who).unwrap_or_default();

            // Update stats
            if let Some(races) = total_races {
                stats.total_races = races;
            }
            if let Some(w) = wins {
                stats.wins = w;
            }
            if let Some(distance) = total_distance {
                stats.total_distance = distance;
            }
            if let Some(rewards) = total_rewards {
                stats.total_rewards = rewards;
            }

            // Store updated stats
            UserStatsMap::<T>::insert(&who, stats.clone());

            Self::deposit_event(Event::StatsUpdated {
                account: who,
                total_races: stats.total_races,
                wins: stats.wins,
                total_distance: stats.total_distance,
                total_rewards: stats.total_rewards,
            });

            Ok(())
        }
    }
}
