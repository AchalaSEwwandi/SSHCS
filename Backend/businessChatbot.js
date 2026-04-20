function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s%.,-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(haystack, needles) {
  return needles.some(n => haystack.includes(n));
}

function isGreetingMessage(m) {
  // Match greetings only as standalone words/phrases, not inside words like "this".
  return /^(hi|hello|hey|good morning|good evening)\b/.test(m);
}

function bullets(items) {
  return items.map(i => `- ${i}`).join('\n');
}

function isBusinessQuestion(m) {
  // Keep this conservative: if it's not clearly small-business related, don't answer.
  const businessKeywords = [
    'business', 'small business', 'startup', 'start up', 'shop', 'store', 'sell', 'selling', 'service',
    'product', 'customers', 'client', 'clients', 'supplier', 'inventory', 'stock', 'restock', 'wholesale',
    'price', 'pricing', 'profit', 'loss', 'revenue', 'income', 'cashflow', 'cash flow', 'break even', 'breakeven',
    'cost', 'budget', 'capital', 'investment', 'marketing', 'advertise', 'promotion', 'brand',
    'instagram', 'tiktok', 'facebook', 'whatsapp', 'orders', 'delivery', 'refund', 'complaint',
    'license', 'registration', 'register', 'tax',
    'sales', 'order', 'offer', 'discount', 'promotion', 'campaign',
    'hiring', 'hire', 'recruit', 'staff',
    'accounting', 'bookkeeping', 'records', 'record keeping', 'ledger', 'expense', 'expenses',
    'invoice', 'billing', 'payment',
    'roi', 'growth', 'scale',
    // Common business-planning / funding terms
    'business plan', 'pitch', 'proposal', 'swot', 'funding', 'loan', 'financing', 'investor',
    // Marketing channels
    'advertising', 'ads', 'seo', 'campaign',
  ];

  // If they ask a "how to start" question, only answer if business context exists.
  const looksLikeHowToStart =
    (
      // Explicit small-business start intent
      (
        hasAny(m, ['how do i start', 'how to start', 'how i start', 'start a', 'start my']) &&
        hasAny(m, [
          'business', 'startup', 'shop', 'store', 'sell', 'service', 'product',
          'budget', 'pricing', 'marketing', 'customers', 'funding', 'profit', 'inventory', 'delivery',
        ])
      ) ||
      // Common follow-up phrasing in this small-business chat panel
      hasAny(m, ['how can i start', 'how can i begin', 'how do i begin', 'how to begin'])
    );

  const hasBusiness = hasAny(m, businessKeywords);
  // Accept common misspellings of "business" used by students.
  const hasBusinessTypo = /\b(busniess|bussiness|buisness)\b/.test(m);
  const hasStartIntent = /\bhow\s+(do|can)?\s*i?\s*start\b/.test(m) || /\bhow\s+i\s+start\b/.test(m);
  const hasBusinessFollowupIntent =
    hasAny(m, [
      'what i do first',
      'what should i do first',
      'what to do first',
      'how i do this',
      'how do this',
      'how to do this',
      'what next',
      'next step',
      'next steps',
      'then what',
      'then what i do',
      'what should i do now',
      'what do i do now',
      'after that what',
      'after that what i do',
      'what is next',
      'what now',
    ]);

  return hasBusiness || hasBusinessTypo || looksLikeHowToStart || hasStartIntent || hasBusinessFollowupIntent;
}

const fixedQA = [
  {q: "What is a small business?", a: "A small business is a privately owned company with few employees and low revenue.", keywords: ["small business", "private", "employees", "revenue"]},
  {q: "How to start a small business?", a: "Identify an idea, create a plan, arrange money, register, and promote.", keywords: ["start", "idea", "plan", "capital", "promotion"]},
  {q: "What are business ideas?", a: "Ideas like online shops, food services, and freelancing.", keywords: ["ideas", "online", "food", "freelance"]},
  {q: "How much money is needed?", a: "It depends, but many start with low investment.", keywords: ["money", "cost", "investment"]},
  {q: "How to promote a business?", a: "Use social media, ads, and word of mouth.", keywords: ["promotion", "social media", "ads"]},
  {q: "What challenges exist?", a: "Competition, low funds, and lack of experience.", keywords: ["challenges", "competition", "funds"]},
  {q: "How to make profit?", a: "Reduce costs and increase sales.", keywords: ["profit", "cost", "sales"]},
  {q: "Why is customer service important?", a: "It builds trust and loyalty.", keywords: ["service", "trust", "loyalty"]},
  {q: "What is an online business?", a: "A business run through the internet.", keywords: ["online", "internet"]},
  {q: "How to grow a business?", a: "Expand products and reach more customers.", keywords: ["growth", "expansion", "customers"]},
  {q: "What is a business plan?", a: "A document explaining goals and operations.", keywords: ["plan", "goals", "operations"]},
  {q: "What is a target market?", a: "A specific group of customers.", keywords: ["target", "customers"]},
  {q: "What is branding?", a: "Creating a unique identity.", keywords: ["branding", "identity"]},
  {q: "How to set prices?", a: "Based on cost and demand.", keywords: ["pricing", "cost", "demand"]},
  {q: "Why is competition important?", a: "It improves quality and pricing.", keywords: ["competition", "quality"]},
  {q: "What is online marketing?", a: "Promotion using the internet.", keywords: ["marketing", "internet"]},
  {q: "Why is feedback important?", a: "It helps improve products.", keywords: ["feedback", "improvement"]},
  {q: "Why is location important?", a: "It affects sales and visibility.", keywords: ["location", "sales"]},
  {q: "What are digital tools?", a: "Tools like apps and software.", keywords: ["tools", "software"]},
  {q: "Why is time management important?", a: "It improves productivity.", keywords: ["time", "productivity"]},
  {q: "What is business risk?", a: "Chance of loss or failure.", keywords: ["risk", "loss"]},
  {q: "What is innovation?", a: "Creating new ideas or methods.", keywords: ["innovation", "new ideas"]},
  {q: "What is financial management?", a: "Managing money and expenses.", keywords: ["finance", "money"]},
  {q: "How does social media help?", a: "It increases customer reach.", keywords: ["social media", "reach"]},
  {q: "What is sustainability?", a: "Long-term and eco-friendly business.", keywords: ["sustainability", "environment"]},
  {q: "What is entrepreneurship?", a: "Starting and running a business.", keywords: ["entrepreneurship", "business"]},
  {q: "What is profit margin?", a: "Difference between cost and selling price.", keywords: ["profit margin", "cost"]},
  {q: "What is a startup?", a: "A new business.", keywords: ["startup", "new"]},
  {q: "What is cash flow?", a: "Movement of money in and out.", keywords: ["cash flow", "money"]},
  {q: "What is inventory?", a: "Goods available for sale.", keywords: ["inventory", "goods"]},
  {q: "What is leadership?", a: "Guiding and managing a team.", keywords: ["leadership", "team"]},
  {q: "What is teamwork?", a: "Working together to achieve goals.", keywords: ["teamwork", "cooperation"]},
  {q: "What is customer loyalty?", a: "Customers repeatedly buying.", keywords: ["loyalty", "repeat"]},
  {q: "What is advertising?", a: "Promoting products to customers.", keywords: ["advertising", "promotion"]},
  {q: "What is a supplier?", a: "A person who provides goods.", keywords: ["supplier", "goods"]},
  {q: "What is demand?", a: "Customer need for a product.", keywords: ["demand", "need"]},
  {q: "What is supply?", a: "Availability of products.", keywords: ["supply", "availability"]},
  {q: "What is branding logo?", a: "A symbol representing a business.", keywords: ["logo", "symbol"]},
  {q: "What is e-commerce?", a: "Buying and selling online.", keywords: ["e-commerce", "online"]},
  {q: "What is business growth strategy?", a: "A plan to expand business.", keywords: ["growth", "strategy"]},
  {q: "What is customer satisfaction?", a: "Meeting customer expectations.", keywords: ["satisfaction", "expectations"]},
  {q: "What is break-even point?", a: "No profit, no loss stage.", keywords: ["break-even", "balance"]},
  {q: "What is outsourcing?", a: "Hiring outside help.", keywords: ["outsourcing", "external"]},
  {q: "What is networking?", a: "Building business connections.", keywords: ["networking", "connections"]},
  {q: "What is a business license?", a: "Legal permission to operate.", keywords: ["license", "legal"]},
  {q: "What is quality control?", a: "Ensuring product standards.", keywords: ["quality", "standards"]},
  {q: "What is productivity?", a: "Output compared to input.", keywords: ["productivity", "output"]},
  {q: "What is a franchise?", a: "Using another company’s brand.", keywords: ["franchise", "brand"]},
  {q: "What is customer retention?", a: "Keeping existing customers.", keywords: ["retention", "customers"]},
  {q: "What is business success?", a: "Achieving goals and making profit.", keywords: ["success", "goals", "profit"]}
];

function replyFor(message) {
  const m = normalize(message);

  if (!m) {
    return {
      answer:
        "Ask me anything about your small business (pricing, budgeting, marketing, customers, operations, suppliers, inventory, profit, record keeping).",
      topic: 'help',
    };
  }

  if (isGreetingMessage(m)) {
    return {
      answer:
        "Hi! I’m your Small Business Chatbot. Tell me what business you’re doing and ask your question.",
      topic: 'greeting',
    };
  }

  // Intercept with the user's fixed 50 questions
  let bestMatch = null;
  let maxMatched = 0;
  for (const item of fixedQA) {
    const cleanQ = normalize(item.q);
    if (m === cleanQ) {
      return { answer: item.a, topic: 'faq' };
    }
    
    let matchedCount = 0;
    for (const kw of item.keywords) {
      const regex = new RegExp('\\b' + normalize(kw) + '\\b', 'i');
      if (regex.test(m)) matchedCount++;
    }
    
    if (matchedCount > maxMatched && matchedCount > 0) {
      maxMatched = matchedCount;
      bestMatch = item;
    }
  }

  if (bestMatch && maxMatched > 0) {
    return { answer: bestMatch.a, topic: 'faq' };
  }

  // Strict scope: do not answer non-business questions
  if (!isBusinessQuestion(m)) {
    return {
      answer: "Ask any question about small business.",
      topic: 'out_of_scope',
    };
  }

  // Generic follow-up intent inside small-business chat
  if (
    hasAny(m, [
      'what i do first',
      'what should i do first',
      'what to do first',
      'how i do this',
      'how do this',
      'how to do this',
      'what next',
      'next step',
      'next steps',
      'then what',
      'then what i do',
      'what should i do now',
      'what do i do now',
      'after that what',
      'after that what i do',
      'what is next',
      'what now',
    ])
  ) {
    return {
      answer:
        "Start with these 5 steps:\n\n" +
        bullets([
          '1) Pick one clear offer (what you sell and who it is for).',
          '2) Validate demand fast (ask 10-20 people or get 3-5 trial orders).',
          '3) Calculate cost and set a simple profitable price.',
          '4) Start a small weekly plan (content/marketing, delivery, and customer follow-up).',
          '5) Track sales and expenses every week, then improve one thing at a time.',
        ]),
      topic: 'next_steps',
    };
  }

  // Business plan
  if (hasAny(m, ['business plan', 'business-plan', 'businessplan'])) {
    return {
      answer:
        "Here’s a simple small-business plan you can write in 1–2 pages:\n\n" +
        bullets([
          '1) Executive summary: What business you run + what you sell + your target customers + your goals (and funding need if any).',
          '2) Product/Service: What you offer and why customers will buy it.',
          '3) Target market: Who your customers are (demographics/needs) and what they currently use/buy.',
          '4) Competitive advantage: What makes you different (quality, speed, price, convenience, skills).',
          '5) Marketing strategy: Your channels (WhatsApp/Instagram/word-of-mouth), pricing approach, and launch plan.',
          '6) Operations: How you produce/deliver, manage stock, and handle orders.',
          '7) Team/roles: Who does what (you + any helpers/partners).',
          '8) Financial plan: Costs, pricing, sales estimate, and weekly profit target.',
          '9) Risks & solutions: Top 3 risks + how you will handle each one.',
          '10) Milestones: Next 2 weeks + next 1 month goals.',
        ]) +
        "\n\nIf you tell me your business type and budget (low/medium/high), I can help you fill this plan.",
      topic: 'business_plan',
    };
  }

  // Pitch / proposal
  if (hasAny(m, ['pitch', 'pitch deck', 'proposal', 'business presentation'])) {
    return {
      answer:
        "Pitch structure (works for funding, campus competitions, or partnerships):\n\n" +
        bullets([
          '1) Hook: One sentence about the problem for customers.',
          '2) Solution: What you sell and how it solves the problem.',
          '3) Market: Who your customers are.',
          '4) Business model: How you make money (pricing + sales channel).',
          '5) Traction (if any): pre-orders, first customers, or test results.',
          '6) Marketing plan: How you will get customers in the next 2–4 weeks.',
          '7) Funding/ask: How much you need and what it will pay for.',
          '8) Closing: What success looks like in 30–60 days.',
        ]) +
        "\n\nIf you share your product/service in 1 line, I can write a short 30-second pitch.",
      topic: 'pitch',
    };
  }

  // SWOT
  if (hasAny(m, ['swot'])) {
    return {
      answer:
        "SWOT template (copy this):\n\n" +
        bullets([
          'Strengths: what you do well (quality, skill, speed, unique offer).',
          'Weaknesses: what may slow you down (limited budget, low brand awareness, small inventory).',
          'Opportunities: gaps/trends you can use (campus demand, seasonal demand, online reach).',
          'Threats: what can hurt you (competition, supplier delays, price wars, bad reviews).',
        ]) +
        "\n\nTell me your business idea and I’ll fill SWOT with specific points.",
      topic: 'swot',
    };
  }

  // Funding / loan / financing
  if (hasAny(m, ['funding', 'loan', 'financing', 'investor', 'capital', 'grant', 'borrow'])) {
    return {
      answer:
        "Funding guide for student small businesses:\n\n" +
        bullets([
          '1) Calculate your real need: stock/tools + marketing + emergency buffer (10%+).',
          '2) Choose the funding type: self-fund, pre-orders, friends/family, or a small loan (if safe/available).',
          '3) For loans: only borrow if your weekly profit is enough to repay without stress.',
          '4) For investors/partners: explain your market + pricing + how you will get customers in 2–4 weeks.',
          '5) Keep simple documents: cost sheet, pricing sheet, and weekly sales/profit target.',
          '6) Avoid scams: never pay “processing fees” to unknown offers.',
        ]) +
        "\n\nTell me how much you need and what you sell, and I’ll suggest the safest next funding step.",
      topic: 'funding',
    };
  }

  // Pricing
  if (hasAny(m, ['price', 'pricing', 'how much should i charge', 'charge', 'profit margin', 'margin'])) {
    return {
      answer:
        "A simple pricing method is: Cost per item + Profit + Extra for overhead.\n\n" +
        bullets([
          'Step 1: Calculate your full cost (materials + packaging + delivery + transaction fees).',
          'Step 2: Add overhead (rent, electricity, internet) divided per item, if applicable.',
          'Step 3: Choose a margin (example: 20–50% for many small student businesses).',
          'Step 4: Check competitor prices and adjust, but never price below your real cost.',
          'Step 5: Test pricing with a small batch and improve based on demand.',
        ]),
      topic: 'pricing',
    };
  }

  // Budget / finance
  if (hasAny(m, ['budget', 'capital', 'startup cost', 'cost', 'investment', 'money'])) {
    return {
      answer:
        "To manage a small budget, separate money into 3 parts: stock/tools, marketing, and emergency.\n\n" +
        bullets([
          'Start tiny: buy only minimum stock/tools for 1–2 weeks.',
          'Track every expense (even small ones).',
          'Keep an emergency buffer (at least 10%).',
          'Reinvest profits gradually instead of borrowing early.',
          'Avoid fixed costs at the beginning (rent, large subscriptions).',
        ]),
      topic: 'budget',
    };
  }

  // Time commitment / weekly hours
  if (
    hasAny(m, ['how many hours', 'hours per week', 'hours a week', 'time per week', 'weekly hours']) ||
    (hasAny(m, ['hours', 'week']) && hasAny(m, ['business', 'startup', 'small business']))
  ) {
    return {
      answer:
        "A good starting point is 10-20 hours per week.\n\n" +
        bullets([
          'Beginner/side hustle: 8-12 hours/week (about 1-2 hours per day).',
          'Growth phase: 15-25 hours/week to handle marketing, sales, and operations.',
          'If you are studying, start small and increase hours only after you see regular sales.',
          'Use a weekly plan: 40% delivery/production, 30% marketing/sales, 20% customer support, 10% tracking finances.',
          'Review every Sunday: if orders increase, add 2-4 hours next week.',
        ]),
      topic: 'time_planning',
    };
  }

  // Starting a small business (general)
  if (
    hasAny(m, ['how do i start', 'how to start', 'how i start', 'how can i start', 'how can i begin', 'how do i begin', 'how to begin', 'start a business', 'start my business', 'startup']) ||
    /\bhow\s+(do|can)?\s*i?\s*start\b/.test(m) ||
    /\bhow\s+i\s+start\b/.test(m)
  ) {
    return {
      answer:
        "A simple way to start a small student business:\n\n" +
        bullets([
          'Pick 1 clear offer (what you sell + who you sell to).',
          'Validate demand quickly (ask 10–20 people / take 5 pre-orders).',
          'Calculate your costs and set a price that includes profit.',
          'Start with a small batch (1–2 weeks) to reduce risk.',
          'Use one channel for marketing (WhatsApp/Instagram) and be consistent.',
          'Track sales + expenses weekly and improve based on what sells.',
        ]),
      topic: 'starting',
    };
  }

  // Profit / break-even
  if (hasAny(m, ['profit', 'loss', 'break even', 'breakeven', 'revenue', 'income', 'cashflow', 'cash flow'])) {
    return {
      answer:
        "Use this quick formula:\n" +
        "- Profit = Sales revenue − Total costs\n" +
        "- Break-even units = Fixed costs ÷ (Price − Variable cost per unit)\n\n" +
        bullets([
          'Separate costs into fixed (rent, subscriptions) and variable (materials per item).',
          'Track weekly profit, not just daily sales.',
          'If cash is tight, reduce variable cost (suppliers) or raise price slightly.',
        ]),
      topic: 'profit',
    };
  }

  // Time commitment / weekly hours planning
  if (
    hasAny(m, [
      'how many hours', 'hours per week', 'hours a week', 'weekly hours',
      'time per week', 'spend a week', 'how much time', 'time should i spend'
    ]) ||
    (hasAny(m, ['hours', 'week']) && hasAny(m, ['business', 'startup', 'small business']))
  ) {
    return {
      answer:
        "A practical weekly schedule for a student small business is 10-20 hours/week.\n\n" +
        bullets([
          'Beginner: 8-12 hrs/week (safe start while studying).',
          'Growth phase: 15-20 hrs/week (faster customer and sales growth).',
          'Split your week: 40% delivery/production, 30% marketing/sales, 20% customer support, 10% planning/finance.',
          'Use a fixed routine (example: 2 hours on weekdays + 6 hours on weekend).',
          'Review weekly results (orders, revenue, profit) and adjust hours based on what works.',
        ]) +
        "\n\nIf you tell me your class timetable, I can create a custom weekly business schedule.",
      topic: 'time_planning',
    };
  }

  // Marketing
  if (hasAny(m, ['market', 'marketing', 'advertise', 'promotion', 'instagram', 'tiktok', 'facebook', 'whatsapp', 'brand'])) {
    return {
      answer:
        "Low-budget marketing that works for students:\n\n" +
        bullets([
          'Pick 1 channel first (Instagram/TikTok/WhatsApp) and post consistently.',
          'Use before/after, behind-the-scenes, and customer feedback posts.',
          'Offer a small launch deal (limited time) to create urgency.',
          'Ask for referrals: “Bring a friend and get 10% off.”',
          'Track what works (which post gives DMs/orders) and repeat it.',
        ]),
      topic: 'marketing',
    };
  }

  // Customers / service
  if (hasAny(m, ['customer', 'clients', 'complaint', 'refund', 'bad review', 'rating', 'service'])) {
    return {
      answer:
        "Customer handling basics:\n\n" +
        bullets([
          'Reply fast and be polite, even if the customer is angry.',
          'Confirm order details clearly (price, delivery time, location).',
          'If you made a mistake: apologize + fix quickly + small compensation if needed.',
          'Use a simple refund/replace rule (clear, consistent).',
          'Collect feedback after delivery and post positive reviews.',
        ]),
      topic: 'customers',
    };
  }

  // Operations / time management
  if (hasAny(m, ['operation', 'process', 'workflow', 'time', 'schedule', 'delivery', 'orders', 'late'])) {
    return {
      answer:
        "To run operations smoothly:\n\n" +
        bullets([
          'Use a simple order sheet (Name, item, price, payment, delivery time, status).',
          'Batch tasks (prepare stock once, deliver once) to save time.',
          'Set cut-off times (example: orders before 3pm delivered same day).',
          'Keep a checklist for packing and quality control.',
        ]),
      topic: 'operations',
    };
  }

  // Suppliers / inventory
  if (hasAny(m, ['supplier', 'wholesale', 'inventory', 'stock', 'restock', 'raw material'])) {
    return {
      answer:
        "Supplier + inventory tips:\n\n" +
        bullets([
          'Start with 2–3 suppliers (avoid dependency on one).',
          'Buy small test quantities first to check quality.',
          'Track fast-moving vs slow-moving stock and reorder only what sells.',
          'Use FIFO for perishable items (first-in, first-out).',
          'Negotiate: better price, credit period, or free delivery.',
        ]),
      topic: 'inventory',
    };
  }

  // Legal / registration (generic)
  if (hasAny(m, ['legal', 'register', 'registration', 'license', 'tax', 'business name'])) {
    return {
      answer:
        "For legal/registration, rules depend on your country and business type, but generally:\n\n" +
        bullets([
          'Start as a small informal student business, then register when income becomes consistent.',
          'Keep basic records (sales, expenses) from day one.',
          'If you sell food/cosmetics, check health/safety requirements early.',
          'Use a simple business name and clear contact info.',
        ]) +
        "\n\nIf you tell me your country/city and what you sell, I can suggest the typical next steps.",
      topic: 'legal',
    };
  }

  // Default fallback
  return {
    answer:
      "I can help with small business questions like pricing, budgeting, marketing, customers, operations, suppliers, inventory, and profit tracking.\n\n" +
      "Tell me:\n" +
      bullets([
        'What business are you doing? (example: snacks, tutoring, delivery, clothing)',
        'What is your main question right now?',
        'Your budget range (low/medium/high) and time per day (optional)',
      ]),
    topic: 'fallback',
  };
}

module.exports = { replyFor };

