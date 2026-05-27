import UserProfileClient from './UserProfileClient';

export async function generateStaticParams() {
  return [
    { username: 'deehaw' },
    { username: 'fastlane99' },
    { username: 'nightcruise' },
    { username: 'dogdad' },
    { username: 'petlover' },
    { username: 'foodhead' },
    { username: 'sneakerhead' },
    { username: 'citynight' },
    { username: 'gymrat' },
    { username: 'nova.fits' },
    { username: 'kicksgod' },
    { username: 'urbanframe' },
    { username: 'fluffyboss' },
  ];
}

export default function UserProfilePage() {
  return <UserProfileClient />;
}
