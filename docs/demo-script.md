# SwitchMate for Providers — Live Demo Script

A 10–15 minute, two-device sales demo that shows the full loop: **goal → session → participant completes it → automatic documentation**.

## Before the call (5 min)

1. Open `https://switch.bestpolity.com/staff.html` and **sign in with Google**.
   - Your account must be in the Firestore `staff` allowlist (see go-live steps).
2. On a **second device** (iPad or phone), open `https://switch.bestpolity.com/session.html` (it will show a "missing invite link" state until we paste a link — that's fine).
3. Seed a demo participant. With the staff portal open and you signed in, paste this in the browser console (Cmd/Ctrl+Shift+J → Console → paste → Enter):

```js
(async () => {
  const me = firebase.auth().currentUser;
  if (!me) return console.log('⚠️ sign in first');
  const ref = await firebase.firestore().collection('clients').add({
    name: 'John',
    staffIds: [me.uid],
    org: 'Demo Org',
    goals: [
      { id: 'g1', type: 'social', title: 'Make a friend (choose a conversation topic)' },
      { id: 'g2', type: 'typing', title: 'Practice typing my name' },
      { id: 'g3', type: 'games',  title: 'Play a computer game' }
    ],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ Created participant', ref.id);
})();
```

> Tip: if you want a *fresh* demo each time, run the snippet again — it creates a new "John". (A future feature will dedupe.)

---

## The demo (10–15 min)

### 1. The pitch hook (1 min)
> "Most day-hab staff spend as much time *documenting* activities as *doing* them. SwitchMate does the documentation for you. Let me show you in ten minutes."

### 2. Add the participant (1 min)
- Show the **Participants** tab → John with his 3 goals (making friends, typing, games).
- Emphasize: *"These are the goals from his actual plan."*

### 3. Build a session (1 min)
- Click John → set **20 minutes** → select all 3 goals → **"Build & start session."**
- Point at the **🔗 Participant link** card that appears.

### 4. Hand off to the participant (2 min)
- Copy the link, open it on the **second device**.
- Show the participant screen: *"Hi John! We have 3 fun activities for you today."*
- Emphasize: **no sign-in, no staff UI, just big buttons and a switch.**

### 5. Run a goal on the participant device (2 min)
- Tap to advance → "Make a friend" → **▶️ Start** launches the choice game.
- Let the viewer see the single-switch interaction (tap/space = select).

### 6. Run a goal on the staff device (2 min)
- On the staff device, use the **▶️ Launch activity** for "Practice typing my name" — show the AAC keyboard.
- Show the per-goal countdown timer.

### 7. The payoff — automatic documentation (2 min)
- End the session → show the **summary screen**:
  - per-goal completion,
  - **"👤 Participant device activity"** block (what John did on his own device, with time on task),
  - the generated **narrative**.
- *"That's the billing note. I didn't type any of it."*

### 8. Sessions history (1 min)
- Show the **Sessions** tab → John's session with the 🔗 icon and the goals/total badge.

### 9. Close (1 min)
- Privacy posture: no participant sign-in, scoped staff access, no ads.
- **Call to action:** "Want to try it with one of your own participants? We'll set up your org and staff this week."

---

## Talking points (preempt objections)

- **"Is this HIPAA-compliant?"** → SwitchMate collects no medical/PHI. It stores participant first names, goals, and activity logs. We can discuss a BAA and data-residency if your org requires it.
- **"Does the participant need to be able to tap?"** → No — a single switch, tap, or any key. It's built for people with limited motor control.
- **"What about my other software?"** → The narrative + metrics export as text/JSON; drop them into whatever billing/notes system you already use.
- **"Who sees the data?"** → Only staff you allowlist, scoped per org.

---

## What to prepare for the call

- [ ] Second device charged, on the same Wi-Fi (or a hotspot).
- [ ] Staff account approved in Firestore.
- [ ] `firestore.rules` published.
- [ ] Have `support@bestpolity.com` handy for follow-up.
