/**
 * Held-out home, design, and construction queries.
 * Written before any score for this set was inspected.
 * Plain floor-plan wording is a release blocker: every query in PLAIN_FLOOR_PLAN_QUERIES must pass.
 */

export type HomeHeldOut = { query: string; useCase: string };

export const PLAIN_FLOOR_PLAN_QUERIES = [
  "Generate renderings from floor plans",
  "I want to submit a photo of my house blueprints and generate an image",
  "upload my blueprint and make a picture of the house",
  "turn house plans into a picture",
  "what will my house look like from the plans",
  "make an image from my floor plan photo",
  "blueprint to realistic picture",
  "render my floor plan",
  "turn a 2D floor plan into 3D",
  "photoreal rendering of a house from blueprints",
  "visualize a remodel",
  "interior design mockup from a photo",
  "sketch to render",
  "floor plan to 3D tour",
  "take a picture of the plans and show me the house",
  "I have a photo of the floor plan, make it look real",
  "turn this sketch of the kitchen into a render",
  "what would the remodel look like",
  "make a realistic picture from the blueprint",
  "house plans to a photo",
  "upload the architectural drawings and get an image of the house",
  "show me the finished house from the floor plan",
  "convert my 2d plan into a picture of the rooms",
  "blueprint photo to a rendering of the exterior",
  "I snapped the house plans, now make an image",
  "from the blueprints, what does the living room look like",
  "generate a picture of the home from the floorplan",
  "turn my hand sketch into a photoreal room",
  "make the floor plan look like a real house",
  "photo of blueprints to an exterior image",
] as const;

const plain: HomeHeldOut[] = PLAIN_FLOOR_PLAN_QUERIES.map((query) => ({
  query,
  useCase: "floor-plan-rendering",
}));

const rest: HomeHeldOut[] = [
  { query: "render the construction drawings so the buyer can see the house", useCase: "floor-plan-rendering" },
  { query: "building plans into a picture of the front elevation", useCase: "floor-plan-rendering" },
  { query: "I photographed the blueprint, make a rendering", useCase: "floor-plan-rendering" },
  { query: "sketch of the addition, render the exterior", useCase: "floor-plan-rendering" },
  { query: "what will the renovation look like in a picture", useCase: "floor-plan-rendering" },
  { query: "turn the PDF floor plan into a furnished image", useCase: "floor-plan-rendering" },

  { query: "sold homes I can drop into a CMA before the appointment", useCase: "cma-comps" },
  { query: "broker price opinion for the listing consult", useCase: "cma-comps" },
  { query: "comparable sales within a few blocks of this house", useCase: "cma-comps" },
  { query: "what should I list this house for after the solds", useCase: "cma-comps" },
  { query: "pull comps for the subject before I quote a price", useCase: "cma-comps" },
  { query: "comparative market analysis the seller can follow", useCase: "cma-comps" },
  { query: "BPO numbers for tomorrow's pricing talk", useCase: "cma-comps" },
  { query: "recently sold homes that actually match this one", useCase: "cma-comps" },

  { query: "MLS remarks from the feature sheet I typed", useCase: "listing-copy" },
  { query: "listing description that stays inside the facts", useCase: "listing-copy" },
  { query: "public remarks for the new condo listing", useCase: "listing-copy" },
  { query: "property description for the brochure, nothing extra", useCase: "listing-copy" },
  { query: "shorten the listing remarks before they go on the MLS", useCase: "listing-copy" },
  { query: "draft the MLS description from these room notes", useCase: "listing-copy" },

  { query: "virtually stage the empty dining room photo", useCase: "listing-photos" },
  { query: "day to dusk on the front listing photo", useCase: "listing-photos" },
  { query: "edit the listing photos before the listing goes live", useCase: "listing-photos" },
  { query: "sky replacement on the exterior listing picture", useCase: "listing-photos" },
  { query: "virtual staging for a vacant living room", useCase: "listing-photos" },
  { query: "brighten the listing pictures without changing the room", useCase: "listing-photos" },

  { query: "make a listing video from the walkthrough clips", useCase: "listing-videos" },
  { query: "property reel for this house tour", useCase: "listing-videos" },
  { query: "turn listing photos into a video tour", useCase: "listing-videos" },
  { query: "cut the long property walkthrough into a short reel", useCase: "listing-videos" },
  { query: "realtor video of the new listing", useCase: "listing-videos" },
  { query: "home tour video with room captions", useCase: "listing-videos" },

  { query: "follow up with the buyers who toured on Saturday", useCase: "realtor-follow-up" },
  { query: "nurture sellers after the listing appointment", useCase: "realtor-follow-up" },
  { query: "buyer follow-up that does not promise a price", useCase: "realtor-follow-up" },
  { query: "past clients I should check in with this month", useCase: "realtor-follow-up" },
  { query: "sphere of influence notes for a Sunday call", useCase: "realtor-follow-up" },
  { query: "seller follow-up after the open house", useCase: "realtor-follow-up" },

  { query: "real estate CRM for my buyer leads", useCase: "real-estate-crm" },
  { query: "realtor CRM so seller contacts are not in a spreadsheet", useCase: "real-estate-crm" },
  { query: "CRM for my listings and the people attached to them", useCase: "real-estate-crm" },
  { query: "keep buyer and seller contacts in one real estate CRM", useCase: "real-estate-crm" },

  { query: "schedule a showing for the couple on Thursday", useCase: "showing-scheduling" },
  { query: "open house schedule for this Saturday", useCase: "showing-scheduling" },
  { query: "showing appointment at 2 and another at 4", useCase: "showing-scheduling" },
  { query: "lockbox code and the showing time on one note", useCase: "showing-scheduling" },

  { query: "seller disclosures still missing from the transaction file", useCase: "transaction-coordination" },
  { query: "earnest money and the escrow timeline", useCase: "transaction-coordination" },
  { query: "coordinate this transaction through closing", useCase: "transaction-coordination" },
  { query: "purchase agreement checklist before we are under contract", useCase: "transaction-coordination" },

  { query: "neighborhood market update for the homeowners I farm", useCase: "market-reports" },
  { query: "client market update with this month's sales", useCase: "market-reports" },
  { query: "market report I can send to the sphere", useCase: "market-reports" },
  { query: "housing market update for the subdivision", useCase: "market-reports" },

  { query: "expired listings in my farm area", useCase: "realtor-prospecting" },
  { query: "circle prospecting the streets behind the listing", useCase: "realtor-prospecting" },
  { query: "geographic farm list of owners", useCase: "realtor-prospecting" },
  { query: "circle prospecting the FSBO streets this weekend", useCase: "realtor-prospecting" },
  { query: "prospect expireds before the weekend", useCase: "realtor-prospecting" },
  { query: "door knock list for the farm area", useCase: "realtor-prospecting" },

  { query: "listing posts for Instagram this week", useCase: "agent-social" },
  { query: "realtor social captions for the new listing", useCase: "agent-social" },
  { query: "instagram for realtors, one post per listing", useCase: "agent-social" },
  { query: "social media for agents who need a weekly listing post", useCase: "agent-social" },

  { query: "maintenance request from the tenant in unit 4", useCase: "property-management" },
  { query: "collect rent and see who still owes", useCase: "property-management" },
  { query: "lease renewal for the duplex", useCase: "property-management" },
  { query: "property management tasks for the rentals I own", useCase: "property-management" },

  { query: "for sale by owner leads with a phone number", useCase: "find-off-market" },
  { query: "off-market houses before they hit the MLS", useCase: "find-off-market" },
  { query: "skip trace the absentee owner", useCase: "find-off-market" },
  { query: "motivated sellers who do not have a listing yet", useCase: "find-off-market" },

  { query: "acreage with zoning that allows a house", useCase: "find-land" },
  { query: "find a parcel I could split", useCase: "find-land" },
  { query: "find the parcel and read the zoning before I offer", useCase: "find-land" },
  { query: "zoning on this lot before I make an offer", useCase: "find-land" },

  { query: "cap rate on this rental before I write an offer", useCase: "rank-property-deals" },
  { query: "rank these flips by after repair value", useCase: "rank-property-deals" },
  { query: "which investment property has the better cash flow", useCase: "rank-property-deals" },
  { query: "fix and flip numbers for the house on Pine", useCase: "rank-property-deals" },

  { query: "make a 3d model of a chair for the game", useCase: "make-3d" },
  { query: "text to 3d for a helmet asset", useCase: "make-3d" },
  { query: "image to 3d of this product photo", useCase: "make-3d" },
  { query: "I need a 3d asset, not a picture of a house", useCase: "make-3d" },

  { query: "concept art of a dragon in a cave", useCase: "make-images" },
  { query: "text to image of a travel poster", useCase: "make-images" },
  { query: "game art for the loading screen", useCase: "make-images" },
  { query: "draw concept art of a spaceship", useCase: "make-images" },

  { query: "AI tools for real estate", useCase: "real-estate" },
  { query: "real estate software for an agent", useCase: "real-estate" },
];

export const HELD_OUT_HOME: HomeHeldOut[] = [...plain, ...rest];
