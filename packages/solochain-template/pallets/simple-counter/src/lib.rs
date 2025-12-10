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
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type WeightInfo: WeightInfo;
    }

    /// Single global counter (defaults to 0).
    #[pallet::storage]
    pub type Counter<T> = StorageValue<_, u64, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        CounterIncremented { new: u64, who: T::AccountId },
        CounterReset { who: T::AccountId },
    }

    #[pallet::error]
    pub enum Error<T> {
        Overflow,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Increment the counter by 1.
        #[pallet::call_index(0)]
        #[pallet::weight(T::WeightInfo::increment())]
        pub fn increment(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;
            let next = Counter::<T>::get()
                .checked_add(1)
                .ok_or(Error::<T>::Overflow)?;
            Counter::<T>::put(next);
            Self::deposit_event(Event::CounterIncremented { new: next, who });
            Ok(())
        }

        /// Reset the counter to zero.
        #[pallet::call_index(1)]
        #[pallet::weight(T::WeightInfo::reset())]
        pub fn reset(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;
            Counter::<T>::put(0);
            Self::deposit_event(Event::CounterReset { who });
            Ok(())
        }
    }
}
