const who = document.querySelector('#who')
const result = document.querySelector('#result')
const claims = document.querySelector('#claims')
const buttons = [...document.querySelectorAll('button[data-action]')]

function show(status) {
  who.textContent = status.signedIn ? 'Signed in' : 'Signed out'
  claims.textContent = status.token ? JSON.stringify(status.token, null, 2) : ''
}

async function run(action) {
  for (const button of buttons) button.disabled = true
  try {
    const answer = await window.desktop.run(action)
    show(answer.status)
    if (action !== 'status') {
      result.textContent = JSON.stringify({ action, ok: true, result: answer.result }, null, 2)
    }
  } catch (error) {
    result.textContent = JSON.stringify({ action, ok: false, error: error.message }, null, 2)
  } finally {
    for (const button of buttons) button.disabled = false
  }
}

for (const button of buttons) {
  button.addEventListener('click', () => run(button.dataset.action))
}
run('status')
