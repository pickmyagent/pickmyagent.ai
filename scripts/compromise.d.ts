declare module "compromise" {
  interface TermJson {
    text: string;
    tags: string[];
  }
  interface Doc {
    json(): Array<{ terms?: TermJson[] }>;
  }
  export default function nlp(text: string): Doc;
}
