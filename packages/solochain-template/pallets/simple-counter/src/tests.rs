use crate::{mock::*, Counter, Error, Event};
use frame_support::{assert_noop, assert_ok};

#[test]
fn increment_updates_counter_and_event() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        assert_ok!(SimpleCounter::increment(RuntimeOrigin::signed(1)));
        assert_eq!(Counter::<Test>::get(), 1);
        System::assert_last_event(Event::CounterIncremented { new: 1, who: 1 }.into());
    });
}

#[test]
fn reset_sets_zero() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        assert_ok!(SimpleCounter::increment(RuntimeOrigin::signed(1)));
        assert_ok!(SimpleCounter::reset(RuntimeOrigin::signed(2)));
        assert_eq!(Counter::<Test>::get(), 0);
        System::assert_last_event(Event::CounterReset { who: 2 }.into());
    });
}

#[test]
fn overflow_guard() {
    new_test_ext().execute_with(|| {
        Counter::<Test>::put(u64::MAX);
        assert_noop!(
            SimpleCounter::increment(RuntimeOrigin::signed(1)),
            Error::<Test>::Overflow
        );
    });
}
