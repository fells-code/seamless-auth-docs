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

export interface Inputs {
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
  vendor: 'Auth0' | 'Okta Customer Identity' | 'Seamless Auth'
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
    vendor: 'Okta Customer Identity',
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
    vendor: 'Okta Customer Identity',
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
    vendor: 'Seamless Auth',
    plan: 'Self-hosted',
    quote: { kind: 'price', usd: selfHostMonthlyUsd, notes },
  }
}

export function calculate(inputs: Inputs): Row[] {
  const auth0Rows: Row[] = auth0Plans
    .filter((plan) => plan.useCase === inputs.useCase)
    .map((plan) => ({
      vendor: 'Auth0',
      plan: plan.name,
      quote: auth0Quote(plan, inputs),
      salesUrl: sources.auth0Sales.url,
    }))
  auth0Rows.push({
    vendor: 'Auth0',
    plan: 'Enterprise',
    quote: { kind: 'contact', notes: ['Priced by Auth0 sales.'] },
    salesUrl: sources.auth0Sales.url,
  })
  return [...auth0Rows, ...oktaRows(inputs), seamlessRow(inputs)]
}

function useCaseName(useCase: UseCase): string {
  return useCase === 'b2c' ? 'B2C' : 'B2B'
}
