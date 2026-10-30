// Every price on the Identity Cost Calculator page comes from this file. Each value was read
// from the vendor's own page on the `checked` date of its source. Re-check them all on the day
// the page is republished, and never add a price the source does not print.

export type UseCase = 'b2c' | 'b2b'
export type Mfa = 'none' | 'otp' | 'enterprise'

export interface Source {
  label: string
  url: string
  checked: string
}

export const sources = {
  auth0: {
    label: 'Auth0 pricing',
    url: 'https://auth0.com/pricing',
    checked: '2026-10-21',
  },
  auth0Sales: {
    label: 'Auth0 sales',
    url: 'https://auth0.com/contact-us',
    checked: '2026-10-21',
  },
  okta: {
    label: 'Okta plans and pricing, Customer Identity tab',
    url: 'https://www.okta.com/pricing/',
    checked: '2026-10-21',
  },
  oktaSales: {
    label: 'Okta sales',
    url: 'https://www.okta.com/contact-sales/',
    checked: '2026-10-21',
  },
  cognito: {
    label: 'Amazon Cognito pricing',
    url: 'https://aws.amazon.com/cognito/pricing/',
    checked: '2026-10-29',
  },
  clerk: {
    label: 'Clerk pricing',
    url: 'https://clerk.com/pricing',
    checked: '2026-10-29',
  },
  clerkSales: {
    label: 'Clerk sales',
    url: 'https://clerk.com/contact/sales',
    checked: '2026-10-29',
  },
  firebase: {
    label: 'Firebase pricing',
    url: 'https://firebase.google.com/pricing',
    checked: '2026-10-29',
  },
  identityPlatform: {
    label: 'Google Cloud Identity Platform pricing',
    url: 'https://cloud.google.com/identity-platform/pricing',
    checked: '2026-10-29',
  },
  doDroplets: {
    label: 'DigitalOcean Droplet pricing',
    url: 'https://www.digitalocean.com/pricing/droplets',
    checked: '2026-10-21',
  },
  doDatabases: {
    label: 'DigitalOcean Managed Databases pricing',
    url: 'https://www.digitalocean.com/pricing/managed-databases',
    checked: '2026-10-21',
  },
  doPostgresDocs: {
    label: 'DigitalOcean PostgreSQL pricing details',
    url: 'https://docs.digitalocean.com/products/databases/postgresql/details/pricing/',
    checked: '2026-10-21',
  },
} satisfies Record<string, Source>

export interface Tier {
  upToMau: number
  monthlyUsd: number
}

export type Availability = 'included' | 'add-on' | 'not-included' | 'not-listed'

export interface Auth0Plan {
  id: string
  name: string
  useCase: UseCase
  // Monthly billing. A MAU above the last tier is "Get in touch" on the pricing page.
  tiers: Tier[]
  // Free has no sales path, only a MAU ceiling.
  aboveTiers: 'contact' | 'unavailable'
  enterpriseConnections: { included: number; addOnFromUsd: number | null }
  mfaOtp: Availability
  mfaEnterprise: Availability
  mfaEnterpriseAddOnFromUsd: number | null
}

const free = (useCase: UseCase): Auth0Plan => ({
  id: `${useCase}-free`,
  name: 'Free',
  useCase,
  tiers: [{ upToMau: 25000, monthlyUsd: 0 }],
  aboveTiers: 'unavailable',
  enterpriseConnections: { included: 1, addOnFromUsd: null },
  mfaOtp: 'not-included',
  mfaEnterprise: 'not-listed',
  mfaEnterpriseAddOnFromUsd: null,
})

export const auth0Plans: Auth0Plan[] = [
  free('b2c'),
  {
    id: 'b2c-essentials',
    name: 'Essentials',
    useCase: 'b2c',
    tiers: [
      { upToMau: 500, monthlyUsd: 35 },
      { upToMau: 1000, monthlyUsd: 70 },
      { upToMau: 2500, monthlyUsd: 175 },
      { upToMau: 5000, monthlyUsd: 350 },
      { upToMau: 7500, monthlyUsd: 525 },
      { upToMau: 10000, monthlyUsd: 700 },
      { upToMau: 20000, monthlyUsd: 1400 },
      { upToMau: 30000, monthlyUsd: 2100 },
    ],
    aboveTiers: 'contact',
    enterpriseConnections: { included: 0, addOnFromUsd: null },
    mfaOtp: 'included',
    mfaEnterprise: 'not-listed',
    mfaEnterpriseAddOnFromUsd: null,
  },
  {
    id: 'b2c-professional',
    name: 'Professional',
    useCase: 'b2c',
    tiers: [
      { upToMau: 500, monthlyUsd: 240 },
      { upToMau: 1000, monthlyUsd: 240 },
      { upToMau: 2500, monthlyUsd: 545 },
      { upToMau: 5000, monthlyUsd: 1000 },
      { upToMau: 7500, monthlyUsd: 1200 },
      { upToMau: 10000, monthlyUsd: 1600 },
      { upToMau: 20000, monthlyUsd: 3200 },
    ],
    aboveTiers: 'contact',
    enterpriseConnections: { included: 0, addOnFromUsd: null },
    mfaOtp: 'included',
    mfaEnterprise: 'included',
    mfaEnterpriseAddOnFromUsd: null,
  },
  free('b2b'),
  {
    id: 'b2b-essentials',
    name: 'Essentials',
    useCase: 'b2b',
    tiers: [
      { upToMau: 500, monthlyUsd: 150 },
      { upToMau: 1000, monthlyUsd: 300 },
      { upToMau: 2500, monthlyUsd: 700 },
      { upToMau: 5000, monthlyUsd: 1300 },
      { upToMau: 7500, monthlyUsd: 1725 },
      { upToMau: 10000, monthlyUsd: 2100 },
      { upToMau: 20000, monthlyUsd: 3800 },
    ],
    aboveTiers: 'contact',
    enterpriseConnections: { included: 3, addOnFromUsd: 100 },
    mfaOtp: 'included',
    mfaEnterprise: 'add-on',
    mfaEnterpriseAddOnFromUsd: 100,
  },
  {
    id: 'b2b-professional',
    name: 'Professional',
    useCase: 'b2b',
    tiers: [
      { upToMau: 500, monthlyUsd: 800 },
      { upToMau: 1000, monthlyUsd: 800 },
      { upToMau: 2500, monthlyUsd: 1200 },
      { upToMau: 5000, monthlyUsd: 1500 },
      { upToMau: 7500, monthlyUsd: 1800 },
      { upToMau: 10000, monthlyUsd: 2400 },
    ],
    aboveTiers: 'contact',
    enterpriseConnections: { included: 5, addOnFromUsd: 100 },
    mfaOtp: 'included',
    mfaEnterprise: 'included',
    mfaEnterpriseAddOnFromUsd: null,
  },
]

// The MAU steps on Auth0's pricing slider, used for the static table.
export const auth0MauSteps = [500, 1000, 2500, 5000, 7500, 10000, 20000, 30000]

// Per-user rates are graduated: each tier's rate applies only to the users that fall inside it.
// `upTo: null` is the open-ended top tier.
export interface RateTier {
  upTo: number | null
  perUserUsd: number
}

export function graduatedUsd(count: number, tiers: RateTier[]): number {
  let total = 0
  let floor = 0
  for (const tier of tiers) {
    const ceiling = tier.upTo ?? Number.POSITIVE_INFINITY
    if (count <= floor) break
    total += (Math.min(count, ceiling) - floor) * tier.perUserUsd
    floor = ceiling
  }
  return Math.round(total * 100) / 100
}

export interface PerMauPlan {
  id: string
  name: string
  tiers: RateTier[]
}

// Cognito's tables are region-selectable; these are the US East (N. Virginia) values. Federated
// (SAML or OIDC) users are priced separately from direct and social sign-ins on every plan.
export const cognito = {
  plans: [
    {
      id: 'lite',
      name: 'Lite',
      tiers: [
        { upTo: 10000, perUserUsd: 0 },
        { upTo: 100000, perUserUsd: 0.0055 },
        { upTo: 1000000, perUserUsd: 0.0046 },
        { upTo: 10000000, perUserUsd: 0.00325 },
        { upTo: null, perUserUsd: 0.0025 },
      ],
    },
    {
      id: 'essentials',
      name: 'Essentials',
      tiers: [
        { upTo: 10000, perUserUsd: 0 },
        { upTo: null, perUserUsd: 0.015 },
      ],
    },
    {
      id: 'plus',
      name: 'Plus',
      tiers: [{ upTo: null, perUserUsd: 0.02 }],
    },
  ] satisfies PerMauPlan[],
  federated: { freeMau: 50, perMauUsd: 0.015 },
  region: 'US East (N. Virginia)',
}

// Clerk bills monthly retained users (MRU), not MAU, and counts them per application.
export const clerk = {
  hobbyMruLimit: 50000,
  plans: [
    { id: 'pro', name: 'Pro', monthlyUsd: 25, annualMonthlyUsd: 20 },
    { id: 'business', name: 'Business', monthlyUsd: 300, annualMonthlyUsd: 250 },
  ],
  mruTiers: [
    { upTo: 50000, perUserUsd: 0 },
    { upTo: 100000, perUserUsd: 0.02 },
    { upTo: 1000000, perUserUsd: 0.018 },
    { upTo: 10000000, perUserUsd: 0.015 },
    { upTo: null, perUserUsd: 0.012 },
  ] satisfies RateTier[],
  // Counted per SSO connection: one included on Pro and Business, then these rates, then sales.
  ssoTiers: [
    { upTo: 1, perUserUsd: 0 },
    { upTo: 15, perUserUsd: 75 },
    { upTo: 100, perUserUsd: 60 },
  ] satisfies RateTier[],
  ssoContactAbove: 100,
  smsUsCanadaUsd: 0.01,
  b2b: { includedOrganizations: 100, enhancedAddOnUsd: 100, enhancedAddOnAnnualUsd: 85 },
}

export const firebase = {
  sparkMauLimit: 50000,
  tiers: [
    { upTo: 50000, perUserUsd: 0 },
    { upTo: 100000, perUserUsd: 0.0055 },
    { upTo: 1000000, perUserUsd: 0.0046 },
    { upTo: 10000000, perUserUsd: 0.0032 },
    { upTo: null, perUserUsd: 0.0025 },
  ] satisfies RateTier[],
  federated: { freeMau: 50, perMauUsd: 0.015 },
  smsUsCanadaUsd: 0.01,
  freeSmsPerDay: 10,
}

export const okta = {
  basePlatformFromUsd: 3000,
  billing: 'billed annually',
}

export const selfHost = {
  provider: 'DigitalOcean',
  region: 'any DigitalOcean region (the pricing pages list one price, not a price per region)',
  app: {
    name: 'Basic Droplet, Regular CPU, 2 GiB memory, 1 vCPU, 50 GiB SSD, 2,000 GiB transfer',
    monthlyUsd: 12,
    source: sources.doDroplets,
  },
  database: {
    name: 'Managed PostgreSQL, Standard Edition, Basic node, 1 GiB memory, 1 vCPU, single node, 10 GiB storage',
    monthlyUsd: 15.15,
    source: sources.doDatabases,
  },
  extraStoragePerGibUsd: 0.215,
}

export const selfHostMonthlyUsd = selfHost.app.monthlyUsd + selfHost.database.monthlyUsd

export const vendorIds = ['auth0', 'okta', 'cognito', 'clerk', 'firebase'] as const
export type VendorId = (typeof vendorIds)[number]
export type VendorChoice = VendorId | 'all'

export const vendorNames: Record<VendorId, string> = {
  auth0: 'Auth0',
  okta: 'Okta Customer Identity',
  cognito: 'Amazon Cognito',
  clerk: 'Clerk',
  firebase: 'Firebase Authentication',
}

export function isVendorId(value: unknown): value is VendorId {
  return typeof value === 'string' && (vendorIds as readonly string[]).includes(value)
}

export interface Inputs {
  vendor: VendorChoice
  mau: number
  useCase: UseCase
  enterpriseConnections: number
  mfa: Mfa
}

export type Quote =
  | { kind: 'price'; usd: number; notes: string[] }
  | { kind: 'from'; usd: number; notes: string[] }
  | { kind: 'contact'; notes: string[] }
  | { kind: 'unavailable'; notes: string[] }

export interface Row {
  vendorId: VendorId | 'seamless'
  vendor: string
  plan: string
  quote: Quote
  salesUrl?: string
}

export function usd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export function auth0Quote(plan: Auth0Plan, inputs: Inputs): Quote {
  const tier = plan.tiers.find((t) => inputs.mau <= t.upToMau)
  if (!tier) {
    const top = plan.tiers[plan.tiers.length - 1].upToMau.toLocaleString('en-US')
    if (plan.aboveTiers === 'unavailable') {
      return { kind: 'unavailable', notes: [`${plan.name} covers up to ${top} MAU.`] }
    }
    return {
      kind: 'contact',
      notes: [`The pricing page prints no ${plan.name} price above ${top} MAU.`],
    }
  }

  const notes: string[] = []
  let extra = 0
  let startingPrice = false

  const { included, addOnFromUsd } = plan.enterpriseConnections
  if (inputs.enterpriseConnections > included) {
    if (addOnFromUsd === null) {
      return {
        kind: 'unavailable',
        notes: [
          included === 0
            ? `The pricing page lists no enterprise connections on ${useCaseName(plan.useCase)} ${plan.name}.`
            : `${plan.name} includes ${included} enterprise connection and lists no add-on for more.`,
        ],
      }
    }
    const added = inputs.enterpriseConnections - included
    extra += added * addOnFromUsd
    startingPrice = true
    notes.push(
      `${included} enterprise connections included; ${added} more at a starting price of ${usd(addOnFromUsd)} a month each.`,
    )
  } else if (inputs.enterpriseConnections > 0) {
    notes.push(`Includes ${included} enterprise connection${included === 1 ? '' : 's'}.`)
  }

  if (inputs.mfa === 'otp' && plan.mfaOtp !== 'included') {
    return {
      kind: 'unavailable',
      notes: [`The pricing page lists Pro MFA (OTP apps, Duo) as not included on ${plan.name}.`],
    }
  }
  if (inputs.mfa === 'enterprise') {
    if (plan.mfaEnterprise === 'add-on' && plan.mfaEnterpriseAddOnFromUsd !== null) {
      extra += plan.mfaEnterpriseAddOnFromUsd
      startingPrice = true
      notes.push(
        `Enterprise MFA add-on at a starting price of ${usd(plan.mfaEnterpriseAddOnFromUsd)} a month; SMS is charged separately by carriers.`,
      )
    } else if (plan.mfaEnterprise !== 'included') {
      return {
        kind: 'unavailable',
        notes: [
          `The pricing page does not list Enterprise MFA (SMS, voice, email, WebAuthn, push) on ${useCaseName(plan.useCase)} ${plan.name}.`,
        ],
      }
    }
  }

  const upTo = tier.upToMau.toLocaleString('en-US')
  notes.unshift(`Tier: up to ${upTo} MAU, monthly billing.`)
  const total = tier.monthlyUsd + extra
  return startingPrice ? { kind: 'from', usd: total, notes } : { kind: 'price', usd: total, notes }
}

export function oktaRows(inputs: Inputs): Row[] {
  const addOns: string[] = []
  if (inputs.mfa !== 'none') addOns.push('MFA')
  if (inputs.enterpriseConnections > 0) addOns.push('Inbound Federation')
  const base: Row = {
    vendorId: 'okta',
    vendor: vendorNames.okta,
    plan: 'Enterprise base platform',
    salesUrl: sources.oktaSales.url,
    quote: {
      kind: 'from',
      usd: okta.basePlatformFromUsd,
      notes: [
        `Starting price, ${okta.billing}. Add-ons are priced on usage such as MAU and quoted by sales; the page publishes no price per MAU.`,
        ...(addOns.length
          ? [
              `${addOns.join(' and ')}: add-on${addOns.length > 1 ? 's' : ''} with no published price.`,
            ]
          : []),
      ],
    },
  }
  const suite: Row = {
    vendorId: 'okta',
    vendor: vendorNames.okta,
    plan: inputs.useCase === 'b2c' ? 'B2C Suite' : 'B2B Suite',
    salesUrl: sources.oktaSales.url,
    quote: { kind: 'contact', notes: ['Inquire for pricing.'] },
  }
  return [base, suite]
}

export function seamlessRow(inputs: Inputs): Row {
  const notes = [
    `${selfHost.provider} ${usd(selfHost.app.monthlyUsd)} Droplet plus ${usd(selfHost.database.monthlyUsd)} managed PostgreSQL. No per-user fee, so the cost does not change with MAU.`,
  ]
  if (inputs.enterpriseConnections > 0) {
    notes.push(
      'Seamless Auth has no SAML or per-customer enterprise connections; OAuth and OIDC providers are configured instance-wide.',
    )
  }
  if (inputs.mfa === 'enterprise') {
    notes.push(
      'Second factors are TOTP and passkey (WebAuthn) step-up; there is no push or SMS second factor.',
    )
  }
  return {
    vendorId: 'seamless',
    vendor: 'Seamless Auth',
    plan: 'Self-hosted',
    quote: { kind: 'price', usd: selfHostMonthlyUsd, notes },
  }
}

function perMauRow(
  vendorId: VendorId,
  plan: string,
  mau: number,
  tiers: RateTier[],
  notes: string[],
): Row {
  return {
    vendorId,
    vendor: vendorNames[vendorId],
    plan,
    quote: { kind: 'price', usd: graduatedUsd(mau, tiers), notes },
  }
}

const federatedNote = (federated: { freeMau: number; perMauUsd: number }) =>
  `The price counts every MAU as a direct or social sign-in. Users who sign in through SAML or OIDC are billed instead at ${usd(federated.perMauUsd)} per MAU above the first ${federated.freeMau} a month, so it is a starting price when you use them.`

const asStartingPrice = (row: Row): Row =>
  row.quote.kind === 'price' ? { ...row, quote: { ...row.quote, kind: 'from' } } : row

export function cognitoRows(inputs: Inputs): Row[] {
  return cognito.plans.map((plan) => {
    const notes = [
      plan.tiers[0].perUserUsd === 0
        ? `First ${plan.tiers[0].upTo?.toLocaleString('en-US')} MAU free per AWS account or organization, then per MAU (${cognito.region} rates).`
        : `No free tier; ${usd(plan.tiers[0].perUserUsd)} per MAU (${cognito.region} rates).`,
    ]
    if (inputs.mfa !== 'none') {
      notes.push(
        'SMS and email messages are billed separately through Amazon SNS and Amazon SES; the Cognito pricing page prints no rate.',
      )
    }
    if (inputs.enterpriseConnections > 0) notes.push(federatedNote(cognito.federated))
    const row = perMauRow('cognito', plan.name, inputs.mau, plan.tiers, notes)
    return inputs.enterpriseConnections > 0 ? asStartingPrice(row) : row
  })
}

export function clerkRows(inputs: Inputs): Row[] {
  const mruNote = `Clerk bills monthly retained users (a user who returns at least a day after signing up), counted per application; the calculator uses your MAU as the MRU count.`
  const smsNote = `SMS is ${usd(clerk.smsUsCanadaUsd)} per SMS in the US and Canada and market rate elsewhere.`
  const b2bNote = `Organizations are counted separately: ${clerk.b2b.includedOrganizations} monthly retained organizations included per app, and linking enterprise connections to organizations is part of the B2B Authentication Enhanced add-on (${usd(clerk.b2b.enhancedAddOnUsd)} a month, ${usd(clerk.b2b.enhancedAddOnAnnualUsd)} billed annually), not counted here.`

  const hobby: Row = {
    vendorId: 'clerk',
    vendor: vendorNames.clerk,
    plan: 'Hobby',
    quote: { kind: 'price', usd: 0, notes: [mruNote] },
  }
  if (inputs.mau > clerk.hobbyMruLimit) {
    hobby.quote = {
      kind: 'unavailable',
      notes: [`Hobby has a ${clerk.hobbyMruLimit.toLocaleString('en-US')} MRU limit per app.`],
    }
  } else if (inputs.enterpriseConnections > 0) {
    hobby.quote = {
      kind: 'unavailable',
      notes: ['The pricing page lists SSO connections as not included on Hobby.'],
    }
  } else if (inputs.mfa !== 'none') {
    hobby.quote = {
      kind: 'unavailable',
      notes: ['The pricing page lists MFA as not included on Hobby.'],
    }
  }

  const paid = clerk.plans.map((plan): Row => {
    const row: Row = {
      vendorId: 'clerk',
      vendor: vendorNames.clerk,
      plan: plan.name,
      salesUrl: sources.clerkSales.url,
      quote: { kind: 'price', usd: 0, notes: [] },
    }
    if (inputs.enterpriseConnections > clerk.ssoContactAbove) {
      row.quote = {
        kind: 'contact',
        notes: [
          `The pricing page prints no price for more than ${clerk.ssoContactAbove} SSO connections.`,
        ],
      }
      return row
    }
    const users = graduatedUsd(inputs.mau, clerk.mruTiers)
    const sso = graduatedUsd(inputs.enterpriseConnections, clerk.ssoTiers)
    const notes = [
      `${usd(plan.monthlyUsd)} a month on monthly billing (${usd(plan.annualMonthlyUsd)} billed annually), 50,000 MRU included per app.`,
      mruNote,
    ]
    if (inputs.enterpriseConnections > 0) {
      notes.push(
        `1 SSO connection (SAML, OIDC, or EASIE) included per app; more at $75 a month each up to 15, then $60 each up to 100.`,
      )
    }
    if (inputs.mfa !== 'none') {
      notes.push(
        `MFA is included and covers authenticator apps, SMS codes, and backup codes. ${smsNote}`,
      )
    }
    if (inputs.mfa === 'enterprise') {
      notes.push('Passkeys are included; the pricing page lists no push or voice factor.')
    }
    if (inputs.useCase === 'b2b') notes.push(b2bNote)
    row.quote = {
      kind: 'price',
      usd: Math.round((plan.monthlyUsd + users + sso) * 100) / 100,
      notes,
    }
    return row
  })

  const enterprise: Row = {
    vendorId: 'clerk',
    vendor: vendorNames.clerk,
    plan: 'Enterprise',
    salesUrl: sources.clerkSales.url,
    quote: { kind: 'contact', notes: ['Custom pricing, annual billing only.'] },
  }
  return [hobby, ...paid, enterprise]
}

export function firebaseRows(inputs: Inputs): Row[] {
  const notes = [
    `With Identity Platform: email, phone, anonymous, and social users free up to ${firebase.sparkMauLimit.toLocaleString('en-US')} MAU, then per MAU. Above ${firebase.sparkMauLimit.toLocaleString('en-US')} MAU needs the Blaze (pay as you go) plan.`,
  ]
  if (inputs.mfa !== 'none') {
    notes.push(
      `Phone and multi-factor authentication are billed per SMS sent, ${usd(firebase.smsUsCanadaUsd)} in the US and Canada and more in many other countries; the first ${firebase.freeSmsPerDay} SMS a day are not billed.`,
    )
  }
  if (inputs.enterpriseConnections > 0) notes.push(federatedNote(firebase.federated))
  const row = perMauRow('firebase', 'With Identity Platform', inputs.mau, firebase.tiers, notes)
  return [inputs.enterpriseConnections > 0 ? asStartingPrice(row) : row]
}

export function auth0Rows(inputs: Inputs): Row[] {
  const rows: Row[] = auth0Plans
    .filter((plan) => plan.useCase === inputs.useCase)
    .map((plan) => ({
      vendorId: 'auth0',
      vendor: vendorNames.auth0,
      plan: plan.name,
      quote: auth0Quote(plan, inputs),
      salesUrl: sources.auth0Sales.url,
    }))
  rows.push({
    vendorId: 'auth0',
    vendor: vendorNames.auth0,
    plan: 'Enterprise',
    quote: { kind: 'contact', notes: ['Priced by Auth0 sales.'] },
    salesUrl: sources.auth0Sales.url,
  })
  return rows
}

const rowsByVendor: Record<VendorId, (inputs: Inputs) => Row[]> = {
  auth0: auth0Rows,
  okta: oktaRows,
  cognito: cognitoRows,
  clerk: clerkRows,
  firebase: firebaseRows,
}

export function calculate(inputs: Inputs): Row[] {
  const vendors = inputs.vendor === 'all' ? vendorIds : [inputs.vendor]
  return [...vendors.flatMap((id) => rowsByVendor[id](inputs)), seamlessRow(inputs)]
}

export const maxMau = 1_000_000_000

// Reads `?mau=&vendor=&useCase=&enterpriseConnections=&mfa=`. Anything missing or invalid is
// left out so the form keeps its default for that field.
export function parseQuery(search: string): Partial<Inputs> {
  const params = new URLSearchParams(search)
  const out: Partial<Inputs> = {}
  const whole = (name: string, min: number, max: number) => {
    const raw = params.get(name)
    if (raw === null || !/^\d+$/.test(raw.trim())) return undefined
    const value = Number(raw.trim())
    return value >= min && value <= max ? value : undefined
  }
  const mau = whole('mau', 1, maxMau)
  if (mau !== undefined) out.mau = mau
  const connections = whole('enterpriseConnections', 0, 10000)
  if (connections !== undefined) out.enterpriseConnections = connections
  const vendor = params.get('vendor')?.trim().toLowerCase()
  if (vendor === 'all' || isVendorId(vendor)) out.vendor = vendor
  const useCase = params.get('useCase')
  if (useCase === 'b2c' || useCase === 'b2b') out.useCase = useCase
  const mfa = params.get('mfa')
  if (mfa === 'none' || mfa === 'otp' || mfa === 'enterprise') out.mfa = mfa
  return out
}

function useCaseName(useCase: UseCase): string {
  return useCase === 'b2c' ? 'B2C' : 'B2B'
}
