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

addEventListener('scheduled', (event) => {
  event.waitUntil(handleRequest(event))
})

async function getLastEpisodePublishDate() {
  let req = await fetch(`${API_ENDPOINT}/show/${SHOW_NAME}/lastEpisode`)
  let resp = await req.json()

  return resp['episode']['timestamp']
}

async function episodePublishedToday() {
  const published_timestamp = await getLastEpisodePublishDate()

  const published_date = new Date(published_timestamp * 1000)
  const today = new Date()

  return today.toDateString() == published_date.toDateString()
}

async function sendTelegramMessage(message, chat_id) {
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

async function getScheduledEpisodesCount() {
  let req = await fetch(
    `${API_ENDPOINT}/show/${SHOW_NAME}/scheduledEpisodes`,
    init,
  )
  let resp = await req.json()
  return resp['scheduled_episodes']
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const scheduled_count = await getScheduledEpisodesCount()

  let message_sent = false
  const episode_published_today = await episodePublishedToday()

  if (scheduled_count == 0 && !episode_published_today) {
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
    episode_published_today: episode_published_today
  }

  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  })
}
