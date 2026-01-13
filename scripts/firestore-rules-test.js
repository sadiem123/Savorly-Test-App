const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');

(async () => {
  console.log('Starting Firestore rules tests...');
  const testEnv = await initializeTestEnvironment({
    projectId: 'savorly-8f562',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });

  const unauth = testEnv.unauthenticatedContext();
  const alice = testEnv.authenticatedContext('alice-uid', { email: 'alice@berkeley.edu' });
  const bob = testEnv.authenticatedContext('bob-uid', { email: 'bob@berkeley.edu' });

  const dbUnauth = unauth.firestore();
  const dbAlice = alice.firestore();
  const dbBob = bob.firestore();

  try {
    // USERS reads
    // Unauthenticated cannot read users
    await assertFails(dbUnauth.collection('users').doc('alice-uid').get());
    // Authenticated can read users
    await assertSucceeds(dbAlice.collection('users').doc('alice-uid').get());

    // 1) Unauthenticated can read listings (public-read)
    await assertSucceeds(dbUnauth.collection('listings').doc('l1').get());

    // 2) Unauthenticated cannot write users doc
    await assertFails(dbUnauth.collection('users').doc('alice-uid').set({ email: 'alice@berkeley.edu' }));

    // 3) Authenticated user can write own users doc
    await assertSucceeds(dbAlice.collection('users').doc('alice-uid').set({ email: 'alice@berkeley.edu', role: 'student' }));

    // 4) Authenticated user cannot write other user's doc
    await assertFails(dbAlice.collection('users').doc('bob-uid').set({ email: 'bob@berkeley.edu' }));

    // 5) Authenticated user can create listing with ownerId == uid
    await assertSucceeds(dbAlice.collection('listings').doc('listing1').set({ ownerId: 'alice-uid', title: 'Meal A' }));

    // 6) Non-owner cannot update listing
    await assertFails(dbBob.collection('listings').doc('listing1').update({ title: 'Hacked' }));

    // 6b) Owner can delete listing
    await assertSucceeds(dbAlice.collection('listings').doc('listing1').delete());

    // 7) Conversations: signed-in can create; participants can read
    await assertSucceeds(dbAlice.collection('conversations').doc('conv1').set({ participants: ['alice-uid', 'bob-uid'] }));
    await assertSucceeds(dbBob.collection('conversations').doc('conv1').get());
    // Non-participant cannot read
    await assertFails((await testEnv.authenticatedContext('charlie-uid')).firestore().collection('conversations').doc('conv1').get());

    // 8) Messages: sender must be participant and match auth uid; updates are denied
    await assertSucceeds(
      dbAlice.collection('conversations').doc('conv1').collection('messages').doc('m1').set({
        senderId: 'alice-uid',
        text: 'hello',
      })
    );
    await assertFails(
      dbAlice.collection('conversations').doc('conv1').collection('messages').doc('m1').update({ text: 'edit' })
    );
    // Participant can read message
    await assertSucceeds(dbBob.collection('conversations').doc('conv1').collection('messages').doc('m1').get());
    // Non-participant cannot read message
    await assertFails((await testEnv.authenticatedContext('charlie-uid')).firestore().collection('conversations').doc('conv1').collection('messages').doc('m1').get());

    console.log('✅ All tests passed');
  } catch (e) {
    console.error('❌ Tests failed', e);
    process.exit(1);
  } finally {
    await testEnv.clearFirestore();
    await testEnv.cleanup();
  }
})();