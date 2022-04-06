const API_AUTH_TOKEN = globalThis.API_AUTH_TOKEN
const API_ENDPOINT =
  globalThis.API_ENDPOINT || 'https://www.easypodcast.it/api/v1'
const SHOW_NAME = globalThis.SHOW_NAME || 'easyapple'
const TELEGRAM_BOT_TOKEN = globalThis.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = globalThis.TELEGRAM_CHAT_ID
const init = { headers: { 'X-API-Auth-Token': API_AUTH_TOKEN } }

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

addEventListener('scheduled', event => {
  event.waitUntil(handleRequest(event));
});

async function sendTelegramMessage(message, chat_id) {
  console.log(TELEGRAM_BOT_TOKEN)
  let req = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat_id,
        text: message,
      }),
    },
  )

  const resp = await req.json()
  const success = resp['ok']

  console.log(success ? 'Message sent' : 'Error sending message')

  return success
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  let req = await fetch(
    `${API_ENDPOINT}/show/${SHOW_NAME}/scheduledEpisodes`,
    init,
  )
  let resp = await req.json()
  const scheduled_count = resp['scheduled_episodes']

  let message_sent = false

  if (scheduled_count == 0) {
    console.log(`${scheduled_count} episodes scheduled, SENDING MESSAGE`)
    message_sent = await sendTelegramMessage(
      `🚨🚨🚨 Nessuna puntata programmata! ⏰⏰⏰`,
      TELEGRAM_CHAT_ID,
    )
  } else {
    console.log(`${scheduled_count} episodes scheduled, not sending message`)
  }

  const result = {
    scheduled_episodes_present: scheduled_count > 0,
    scheduled_episodes: scheduled_count,
    message_sent: message_sent,
  }

  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  })
}
