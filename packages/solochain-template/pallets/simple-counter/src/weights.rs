#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(unused_parens)]

use frame_support::weights::{constants::RocksDbWeight, Weight};
use frame_support::traits::Get;
use core::marker::PhantomData;

pub trait WeightInfo {
	fn increment() -> Weight;
	fn reset() -> Weight;
}

pub struct SubstrateWeight<T>(PhantomData<T>);
impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {
	fn increment() -> Weight {
		Weight::from_parts(6_000_000, 0)
			.saturating_add(T::DbWeight::get().reads(1))
			.saturating_add(T::DbWeight::get().writes(1))
	}
	fn reset() -> Weight {
		Weight::from_parts(5_000_000, 0)
			.saturating_add(T::DbWeight::get().writes(1))
	}
}

impl WeightInfo for () {
	fn increment() -> Weight {
		Weight::from_parts(6_000_000, 0)
			.saturating_add(RocksDbWeight::get().reads(1))
			.saturating_add(RocksDbWeight::get().writes(1))
	}
	fn reset() -> Weight {
		Weight::from_parts(5_000_000, 0)
			.saturating_add(RocksDbWeight::get().writes(1))
	}
}

