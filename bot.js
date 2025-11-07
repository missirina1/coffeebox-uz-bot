import { Telegraf, Markup } from 'telegraf'

const BOT_TOKEN = process.env.BOT_TOKEN
const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID
const FORWARD_TYPES = (process.env.FORWARD_TYPES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

if (!BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not set in .env')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)
const sessions = new Map()

const buttons = [
  '☕ Хочу 1 кофейню',
  '🔥 Стать главным партнёром Coffeebox (10 кофеен)',
  '💰 Рассчитать прибыль'
]

bot.telegram.setMyCommands([
  {
    command: 'start',
    description: 'Начать диалог с ботом'
  }
]).catch(console.error)

// START только в ЛС
bot.start(async (ctx) => {
  if (ctx.chat.type !== 'private') {
    try {
      await ctx.reply('💬 Для работы с ботом напишите мне в личные сообщения', {
        reply_markup: {
          remove_keyboard: true,
          selective: false
        }
      })
    } catch (error) {
      console.log('Keyboard already removed or no permissions')
    }
    return
  }

  ctx.reply(
    `Привет!  
Добро пожаловать в <b>Coffeebox Uzbekistan</b> —  
сеть автоматизированных кофеен без бариста, без аренды, с телеметрией и поддержкой.  

Мы — <b>лидер рынка</b> в Казахстане: почти 300 кофеен уже работают и приносят прибыль партнёрам.  
Теперь Coffeebox заходит в Узбекистан 🇺🇿.

Что вас интересует?`,
    {
      parse_mode: 'HTML',
      reply_markup: { 
        keyboard: [
          [buttons[0]],
          [buttons[1]],
          [buttons[2]]
        ],
        resize_keyboard: true
      }
    }
  )
  
  const chatId = ctx.chat.id
  sessions.delete(chatId)
})

// Начало диалога
function beginFlow(ctx, typeText) {
  const chatId = ctx.chat.id 
  
  sessions.set(chatId, { stage: null, type: typeText })

  if (typeText === '☕ Хочу 1 кофейню') {
    ctx.reply(
      '☕ Отличный выбор!\n' +
      'Coffeebox — автоматизированная кофейня 24/7:\n' +
      'без бариста, без аренды, без персонала.\n\n' +
      '💰 Стоимость — 30–48 млн сум (≈ 4 700 – 7 500 USD)\n' +
      '📈 Прибыль — 6 – 9 млн сум/мес\n' +
      '⏱ Окупаемость — 12–16 месяцев\n' +
      '📦 Всё под ключ: оборудование + бренд + поддержка\n\n' +
      'Хотите точный расчёт прибыли?',
      Markup.inlineKeyboard([
        [Markup.button.callback('📊 Да, хочу расчёт', 'small_calc')],
        [Markup.button.callback('📞 Связаться с менеджером', 'small_contact')]
      ])
    )
  }

  if (typeText === '🔥 Стать главным партнёром Coffeebox (10 кофеен)') {
    ctx.reply(
      '🔥 Класс!\n' +
      'Пакет для главного партнёра — 10 кофеен под ключ.\n' +
      'Вы зарабатываете на масштабе 💸\n\n' +
      '💰 Инвестиция — ~840 млн сум (≈ 70 000 USD)\n' +
      '🎁 Выгода — ~90 млн сум (≈ 7 500 USD) → одна кофейня в подарок\n' +
      '📈 Доход — 60–90 млн сум/мес\n' +
      '⏱ Окупаемость — 10–14 месяцев\n\n' +
      'Мы лично приезжаем, выбираем локации и запускаем сеть.\n' +
      'Отправить условия партнёрства?',
      Markup.inlineKeyboard([
        [Markup.button.callback('📄 Да, отправь условия', 'big_conditions')],
        [Markup.button.callback('🤝 Хочу поговорить с представителем', 'big_contact')]
      ])
    )
  }

  if (typeText === '💰 Рассчитать прибыль') {
    ctx.reply(
      '📊 Рассчитаем прибыль!\n' +
      'Сколько чашек кофе в день планируете продавать?',
      Markup.inlineKeyboard([
        [Markup.button.callback('15–20 ☕ (реалистично)', 'flow_15')],
        [Markup.button.callback('30–40 ⚡ (активный поток)', 'flow_30')],
        [Markup.button.callback('📈 Хочу средний расчёт', 'flow_avg')]
      ])
    )
  }
}

// Кнопки обрабатываем только в личке
for (const b of buttons) {
  bot.hears(b, (ctx) => {
    if (ctx.chat.type !== 'private') return
    beginFlow(ctx, b)
  })
}

// Команды, например /id
bot.command('id', (ctx) => {
  if (ctx.chat.type !== 'private') return
  ctx.reply(`chat.id = ${ctx.chat.id}`)
})

// Обработчики для кнопок расчета прибыли
bot.action(['flow_15', 'flow_30', 'flow_avg'], (ctx) => {
  ctx.answerCbQuery()
  const chatId = ctx.chat.id

  let message = ''
  let flowName = ''

  if (ctx.match[0] === 'flow_15') {
    message = '✅ При 15–20 чашках в день чистая прибыль 6–9 млн сумов в месяц.  \n' +
              'Окупаемость 12–16 месяцев.'
    flowName = '15-20 чашек в день'
  } else if (ctx.match[0] === 'flow_30') {
    message = '⚡ При 30–40 чашках в день прибыль 10–14 млн сумов в месяц.\n' +
              'Окупаемость до 1 года.'
    flowName = '30-40 чашек в день'
  } else {
    message = '📈 Средняя кофейня Coffeebox продаёт 25–30 чашек в день и зарабатывает 9–11 млн сумов в месяц.\n' +
              'Окупаемость ≈ 12 месяцев.'
    flowName = 'Средний расчёт'
  }

  sessions.set(chatId, { 
    stage: 'profit_calc_choice', 
    type: '💰 Рассчитать прибыль',
    flowType: ctx.match[0],
    flowName: flowName
  })

  ctx.reply(
    message + '\n\nХотите получить детальный расчёт и примеры реальных кофеен?',
    Markup.inlineKeyboard([
      [Markup.button.callback('📊 Да, хочу расчёт', 'profit_calc_confirm')],
      [Markup.button.callback('📞 Связаться с менеджером', 'profit_contact')]
    ])
  )
})

// Обработчик для кнопки "Да, хочу расчёт" в ветке расчета прибыли
bot.action('profit_calc_confirm', (ctx) => {
  ctx.answerCbQuery()
  const chatId = ctx.chat.id
  const state = sessions.get(chatId) || {}
  
  sessions.set(chatId, { 
    stage: 'phone', 
    type: '💰 Рассчитать прибыль',
    flowType: 'calculation',
    flowName: state.flowName,
    originalFlow: state.flowType
  })

  ctx.reply(
    'Отлично 👍\n' +
    'Чтобы отправить вам детальный расчёт и примеры кофеен —\n' +
    'оставьте, пожалуйста, ваш номер телефона 👇',
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Отправить мой номер')]
    ]).resize()
  )
})

// Обработчик для кнопки "Связаться с менеджером" в ветке расчета прибыли
bot.action('profit_contact', (ctx) => {
  ctx.answerCbQuery()
  const chatId = ctx.chat.id
  const state = sessions.get(chatId) || {}
  
  sessions.set(chatId, { 
    stage: 'phone', 
    type: '💰 Рассчитать прибыль',
    flowType: 'contact',
    flowName: state.flowName,
    originalFlow: state.flowType
  })

  ctx.reply(
    'Пожалуйста, отправьте ваш номер телефона 👇',
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Отправить мой номер')]
    ]).resize()
  )
})

//да, хочу рассчет
bot.action('small_calc', (ctx) => {
  ctx.answerCbQuery()
  const chatId = ctx.chat.id
  sessions.set(chatId, { stage: 'phone', type: '☕ Хочу 1 кофейню' })

  ctx.reply(
    'Отлично 👍\n' +
    'Чтобы отправить вам расчёт и примеры кофеен —\n' +
    'оставьте, пожалуйста, ваш номер телефона 👇',
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Отправить мой номер')]
    ]).resize()
  )
})

//да, отправь условия
bot.action('big_conditions', (ctx) => {
  ctx.answerCbQuery()
  const chatId = ctx.chat.id
  sessions.set(chatId, { stage: 'phone', type: '🔥 Стать главным партнёром Coffeebox (10 кофеен)' })

  ctx.reply(
    'Чтобы отправить условия партнёрства —\n' +
    'напишите ваш номер телефона 👇',
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Отправить мой номер')]
    ]).resize()
  )
})

//связаться с менеджером, связаться с представителем
bot.action('small_contact', askPhone)
bot.action('big_contact', askPhone)

function askPhone(ctx) {
  ctx.answerCbQuery()
  const chatId = ctx.chat.id
  const type = ctx.match[0] === 'small_contact'
    ? '☕ Хочу 1 кофейню'
    : '🔥 Стать главным партнёром Coffeebox (10 кофеен)'

  sessions.set(chatId, { stage: 'phone', type })

  ctx.reply(
    'Пожалуйста, отправьте ваш номер телефона 👇',
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Отправить мой номер')]
    ]).resize()
  )
}

//получение контакта + вопрос имени
bot.on('contact', async (ctx) => {
  if (ctx.chat.type !== 'private') return

  const chatId = ctx.chat.id
  const state = sessions.get(chatId)
  if (!state) return

  state.phone = ctx.message.contact.phone_number
  state.stage = 'name'
  sessions.set(chatId, state)

  await ctx.reply('Как к вам обращаться? 😊')
})

// Текстовые сообщения — только личка
bot.on('text', async (ctx) => {
  if (ctx.chat.type !== 'private') return

  const chatId = ctx.chat.id
  const state = sessions.get(chatId)
  if (!state) return

  if (state.stage === 'name') {
    state.name = ctx.message.text.trim()
    return sendLeadToAdmin(ctx, state)
  }

  if (state.stage === 'phone') {
    state.phone = ctx.message.text.trim()
    state.stage = 'name'
    sessions.set(chatId, state)
    return ctx.reply('Как к вам обращаться? 😊')
  }
})

// Обработчик для сообщений в группах - убираем клавиатуру
bot.on('message', async (ctx) => {
  if (ctx.chat.type !== 'private') {
    try {
      await ctx.reply('💬 Бот работает только в личных сообщениях', {
        reply_markup: {
          remove_keyboard: true,
          selective: false
        }
      })
    } catch (error) {
      // Игнорируем ошибки
    }
  }
})

async function sendLeadToAdmin(ctx, state) {
  const chatId = ctx.chat.id

  let flowInfo = ''
  if (state.type === '💰 Рассчитать прибыль' && state.flowName) {
    flowInfo = `\nПрогноз прибыли: ${state.flowName}`
  } else if (state.flowType) {
    const flowNames = {
      'calculation': 'Запрос расчёта',
      'conditions': 'Запрос условий',
      'contact': 'Связь с менеджером'
    }
    flowInfo = `\nТип запроса: ${flowNames[state.flowType] || state.flowType}`
  }

  const leadText = `🔥 Новый лид:
Тип: ${state.type}${flowInfo}
Имя: ${state.name}
Телефон: ${state.phone}
TG: ${ctx.from.username ? '@' + ctx.from.username : '–'}`

  const shouldForward =
    FORWARD_TYPES.length === 0 ||
    FORWARD_TYPES.includes(state.type)

  if (shouldForward && ADMIN_GROUP_ID) {
    try {
      await ctx.telegram.sendMessage(ADMIN_GROUP_ID, leadText)
      console.log('✅ Lead forward:', state.type)
    } catch (err) {
      console.error('❌ Forward failed:', err?.description || err)
    }
  } else {
    console.log('🚫 Lead filtered —', state.type)
  }

  let finalMessage = ''
  
  if (state.type === '☕ Хочу 1 кофейню') {
    if (state.flowType === 'calculation') {
      finalMessage = 'Спасибо! ☕\nНаш менеджер свяжется с вами и вышлет расчёт окупаемости и детали запуска.\n\n📊 Пример: при 20 чашках в день прибыль 6–9 млн сумов в месяц.'
    } else {
      finalMessage = 'Спасибо! Наш менеджер свяжется с вами в ближайшее время для консультации по открытию кофейни Coffeebox. ☕'
    }
  } else if (state.type === '🔥 Стать главным партнёром Coffeebox (10 кофеен)') {
    if (state.flowType === 'conditions') {
      finalMessage = 'Спасибо!\nМы свяжемся с вами в ближайшее время и покажем, как запустить первые 10 кофеен Coffeebox в Ташкенте.\n\n🚀 Начинаем с вас — первого главного партнёра в Узбекистане.'
    } else {
      finalMessage = 'Спасибо! Наш представитель свяжется с вами для обсуждения условий партнёрства по запуску 10 кофеен. 🤝'
    }
  } else if (state.type === '💰 Рассчитать прибыль') {
    finalMessage = 'Спасибо! Наш специалист свяжется с вами для детального расчёта прибыли и консультации. 📊'
  } else {
    finalMessage = 'Спасибо! Мы скоро свяжемся с вами ☕🚀'
  }

  await ctx.reply(finalMessage)
  sessions.delete(chatId)
}

bot.launch()
  .then(() => console.log('✅ Bot launched'))
  .catch((err) => {
    console.error('❌ Launch failed:', err)
    process.exit(1)
  })

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))