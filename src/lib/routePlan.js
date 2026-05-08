/**
 * Builds stop list + map/nav copy from the chips picked on "Set up your visit"
 * (there is no free-text field yet — selections drive the tailoring).
 */

const INTEREST_PLANS = {
  'General history': {
    destCode: 'History trail · start',
    youAreHere: 'Main entrance · foyer',
    stops: [
      { title: 'Old Stockholm streets & neighbourhoods', wing: 'Ground floor · city models' },
      { title: 'Growth, trade & everyday life', wing: 'Level 2 · civic life' },
      { title: 'People who shaped Stockholm', wing: 'Level 3 · portraits & stories' },
    ],
    firstLead:
      'A good place to begin your overview of how the city grew and how people lived here.',
    navSentence: ({ style }) =>
      `Begin with Stockholm's layered past—maps, neighbourhoods, and the rhythm of everyday life—using a ${style.toLowerCase()} thread through the galleries.`,
  },
  'Applied arts': {
    destCode: 'Craft & utensils · wing B',
    youAreHere: 'Entrance hall · lockers',
    stops: [
      { title: 'Household craft & utensils', wing: 'Ground floor · workshops' },
      { title: 'Trade, tools & materials', wing: 'Level 2 · artisan life' },
      { title: 'Textiles, metal & ceramics in use', wing: 'Level 3 · applied galleries' },
    ],
    firstLead: 'Hands-on stories of things people made and used—ideal for applied-arts curiosity.',
    navSentence: ({ style }) =>
      `Start among tools, vessels, and workshop stories, then widen to trade and textiles—organized in a ${style.toLowerCase()} arc through the floors.`,
  },
  'Design & craft': {
    destCode: 'Design stories · pavilion',
    youAreHere: 'Main lobby · stairs',
    stops: [
      { title: 'Form, function & materials', wing: 'Ground floor · prototypes' },
      { title: 'Makers & production in the city', wing: 'Industry & craft · level 2' },
      { title: 'Objects that shaped daily life', wing: 'Gallery loop · level 3' },
    ],
    firstLead: 'Opens with shape, material, and use—perfect for design-and-craft explorers.',
    navSentence: ({ style }) =>
      `Ease in with designed objects and their makers; the route keeps a ${style.toLowerCase()} lens as you climb through the galleries.`,
  },
  'Nordic art': {
    destCode: 'Nordic rooms · Salon start',
    youAreHere: 'Atrium · information desk',
    stops: [
      { title: 'Nordic painting & salon hangs', wing: 'First galleries · Nordic' },
      { title: 'Portraits & Stockholm sitters', wing: 'Portrait corridor · mid wing' },
      { title: 'Art & the modern city', wing: 'Upper gallery · crossings' },
    ],
    firstLead: 'Begins among Nordic painting and Salon-style hangs before portraits and newer city-facing art.',
    navSentence: ({ style }) =>
      `Orient from Nordic painting outward into portraits and city life—timed as a ${style.toLowerCase()} walk through the art floors.`,
  },
};

const DEFAULT_INTEREST_KEY = 'General history';

/** @param {{ time?: string, interest?: string, style?: string }} setup */
export function personalizedRoutePlan(setup = {}) {
  const interest = INTEREST_PLANS[setup.interest]
    ? setup.interest
    : DEFAULT_INTEREST_KEY;
  const style = setup.style || 'Story-based';
  const template = INTEREST_PLANS[interest];

  const { parts } = splitTimeMinutes(setup.time || '90 min');
  const stopCount = template.stops.length;

  const stops = template.stops.map((row, idx) => {
    const mins = parts[idx] ?? Math.round(parts.reduce((a, b) => a + b, 0) / stopCount);
    const seg =
      idx === 0 ? `Start here · ~${mins} min` : `Stop ${idx + 1} · ~${mins} min`;
    return {
      n: idx + 1,
      title: row.title,
      sub: `${row.wing} · ${seg}`,
    };
  });

  const first = template.stops[0];
  return {
    interest,
    style,
    timeLabel: setup.time || '90 min',
    stops,
    youAreHere: template.youAreHere,
    destinationLabel: template.destCode,
    firstStopTitle: first.title,
    firstStopSubtitle: template.firstLead,
    navAiCard: `You're at Stadsmuseet i Stockholm heading toward ${first.title}. ${template.navSentence({
      style,
    })} Use signs and museum staff if a room shifts between seasons.`,
    mapAlt: `Stadsmuseet route map — first stop ${first.title} (${interest})`,
    totalStops: stopCount,
  };
}

function splitTimeMinutes(timeLabel) {
  const m = String(timeLabel || '90').match(/(\d+)/);
  const total = Math.max(45, Number(m?.[1]) || 90);
  let a = Math.round(total / 3);
  let b = Math.round((total - a) / 2);
  let c = total - a - b;
  a = Math.max(10, a);
  b = Math.max(10, b);
  c = Math.max(10, c);
  const drift = total - (a + b + c);
  c += drift;
  if (c < 10) {
    b -= 10 - c;
    c = 10;
    b = Math.max(10, b);
  }
  return { parts: [a, b, c] };
}
