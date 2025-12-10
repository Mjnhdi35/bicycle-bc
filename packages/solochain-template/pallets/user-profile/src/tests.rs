use crate::{mock::*, Error, Event, Profiles, UserStats, UserStatsMap};
use frame_support::{assert_noop, assert_ok};

#[test]
fn set_username_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1;
        let username = b"alice".to_vec();

        // Set username (profile created automatically)
        assert_ok!(UserProfile::set_username(
            RuntimeOrigin::signed(account),
            username.clone()
        ));

        // Check user profile exists
        let profile = Profiles::<Test>::get(&account).unwrap();
        assert_eq!(profile.account, account);
        assert_eq!(profile.username, username);

        // Check stats initialized
        let stats = UserStatsMap::<Test>::get(&account).unwrap();
        assert_eq!(stats, UserStats::default());

        // Check event
        System::assert_last_event(
            Event::UsernameSet {
                account,
                username: username.try_into().unwrap(),
            }
            .into(),
        );
    });
}

#[test]
fn set_username_fails_if_username_taken() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account1 = 1;
        let account2 = 2;
        let username = b"alice".to_vec();

        // First user sets username
        assert_ok!(UserProfile::set_username(
            RuntimeOrigin::signed(account1),
            username.clone()
        ));

        // Second user tries to use same username
        assert_noop!(
            UserProfile::set_username(RuntimeOrigin::signed(account2), username),
            Error::<Test>::UsernameTaken
        );
    });
}

#[test]
fn update_profile_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1;

        // Update profile (profile created automatically if doesn't exist)
        let new_username = b"alice_new".to_vec();
        let new_bio = b"My bio".to_vec();

        assert_ok!(UserProfile::update_profile(
            RuntimeOrigin::signed(account),
            Some(new_username.clone()),
            None,
            Some(Some(new_bio.clone()))
        ));

        // Check profile updated
        let profile = Profiles::<Test>::get(&account).unwrap();
        assert_eq!(profile.username, new_username);
        assert_eq!(profile.bio, Some(new_bio.try_into().unwrap()));
    });
}

#[test]
fn update_stats_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1;

        // Update stats (no need to register, account exists from frame_system)
        assert_ok!(UserProfile::update_stats(
            RuntimeOrigin::signed(account),
            Some(10),
            Some(5),
            Some(1000),
            Some(5000)
        ));

        // Check stats updated
        let stats = UserStatsMap::<Test>::get(&account).unwrap();
        assert_eq!(stats.total_races, 10);
        assert_eq!(stats.wins, 5);
        assert_eq!(stats.total_distance, 1000);
        assert_eq!(stats.total_rewards, 5000);
    });
}
