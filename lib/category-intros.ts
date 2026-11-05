/**
 * One handwritten sentence for each category.
 * Capability search uses these instead of splicing the matched job into a template.
 */

export const BANNED_INTRO = "you still decide what happens next";

export const CATEGORY_INTROS: Record<string, string> = {
  bookkeeping: "AI agents can sort receipts and suggest a category, and you still match each line to the statement.",
  "finance-ops": "AI agents can read an invoice and flag a purchase order mismatch for a person to approve.",
  interior: "AI agents can restyle a room photo so you can compare finishes before anything is built.",
  architecture: "AI agents can turn a floor plan or a massing study into a picture you compare with the drawing.",
  "real-estate": "AI agents can pull property facts and draft a note, and you still set the price and the next call.",
  legal: "AI agents can draft a contract from the terms you list and mark the lines a lawyer should read.",
  tax: "AI agents can organize income and receipts for a return, and you still decide what gets filed.",
  investing: "AI agents can line up holdings and fees so you can see the mix before you move money.",
  "personal-finance": "AI agents can group accounts and recurring bills so you can see what is due.",
  hr: "AI agents can draft a job post and a screening note, and you still choose who moves forward.",
  hiring: "AI agents can summarize a resume against the role, and you still decide who to interview.",
  resumes: "AI agents can rewrite resume bullets for a posting, and you still check every claim.",
  email: "AI agents can draft a newsletter or a reply, and you still approve the send.",
  marketing: "AI agents can draft a campaign and a landing-page outline, and you still approve the offer.",
  seo: "AI agents can draft a content brief from a keyword, and you still check the sources.",
  ads: "AI agents can draft PPC headlines and a few ad variations, and you still choose what runs.",
  social: "AI agents can draft a post and a caption, and you still pick the day it goes out.",
  content: "AI agents can draft a first version of a page, and you still rewrite the claims.",
  writing: "AI agents can change the tone of a draft, and you still keep the facts you supplied.",
  sales: "AI agents can draft a short outreach note, and you still decide what gets sent.",
  "customer-support": "AI agents can draft a reply from the help center, and a person still sends it.",
  "small-business": "AI agents can draft the customer note, the post, and the bookkeeping list you still finish.",
  meetings: "AI agents can turn a transcript into notes and action items you still assign.",
  knowledge: "AI agents can answer from the pages you already keep, and you still check the source.",
  scheduling: "AI agents can offer open times and a reminder, and you still confirm who is coming.",
  productivity: "AI agents can draft the reply and the next calendar block, and you still send both.",
  education: "AI agents can explain the next step and draft a little practice you still correct.",
  learning: "AI agents can explain the next step and draft a little practice you still correct.",
  "health-fitness": "AI agents can sketch a workout from the days you name, and you still check it with a professional.",
  research: "AI agents can compare sources and draft a short brief with the links you can open.",
  "search-rag": "AI agents can keep a source next to the answer so you can see what the passage actually says.",
  "data-analysis": "AI agents can read a sheet and draft the finding, and you recompute the totals.",
  spreadsheets: "AI agents can write a formula and clean a column, and you still check the result.",
  "coding-agents": "AI agents can edit the code and point at the failing test, and you still review the diff.",
  "dev-tools": "AI agents can look up the API and draft a snippet, and you still run it.",
  "browser-agents": "AI agents can follow steps in a browser you direct and stop when a login appears.",
  "tool-use": "AI agents can follow steps in a browser you direct and stop when a login appears.",
  "agent-frameworks": "AI agents can split a job across a few steps, and you still approve the outcome.",
  "workflow-automation": "AI agents can pass a step from one app to the next, and you still confirm the result.",
  security: "AI agents can flag a suspicious message and list the evidence a person should review.",
  "it-support": "AI agents can draft the password-reset steps and the ticket note a person still sends.",
  image: "AI agents can generate or clean up an image, and you still pick the one you will use.",
  video: "AI agents can outline a shot and a caption, and you still review the clip.",
  "audio-voice": "AI agents can draft a voice script and a transcript, and you still approve the take.",
  music: "AI agents can sketch a beat or a mix note from the style you describe.",
  "3d": "AI agents can generate a 3D model from a prompt, and you still check the scale.",
  design: "AI agents can draft a logo or a landing page, and you still choose the version.",
  "creative-media": "AI agents can turn a sketch or a photo into a new version you still compare with the original.",
  photography: "AI agents can cull and retouch a shoot, and you still pick the frames.",
  gaming: "AI agents can draft dialogue or a sprite, and you still decide what ships in the game.",
  "game-ai": "AI agents can draft what a character may say, and you still set the rules.",
  translation: "AI agents can translate the text you paste and leave terms you should confirm.",
  presentations: "AI agents can turn a document into slides and speaker notes you still edit.",
  ecommerce: "AI agents can rewrite a product title and a description, and you still publish them.",
  shopping: "AI agents can compare a product and a coupon, and you still place the order.",
  travel: "AI agents can draft an itinerary and compare stays, and you still book them.",
  construction: "AI agents can turn a takeoff into a draft estimate you still price.",
  mortgage: "AI agents can list the documents a loan file still needs, and you still verify each one.",
  insurance: "AI agents can organize a claim note and the questions a person still asks.",
  nonprofit: "AI agents can draft a grant paragraph and a donor note you still send.",
  "general-assistants": "AI assistants can lay out the steps, compare a few options, and draft a first version you still edit.",
};

export function categoryIntro(categories: string[]): string {
  for (const category of categories) {
    const intro = CATEGORY_INTROS[category];
    if (intro) return intro;
  }
  return "AI agents can draft a first version of this work, and you still review it before anyone relies on it.";
}
