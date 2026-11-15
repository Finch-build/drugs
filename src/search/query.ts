export type QueryNode =
  | { type: "term"; value: string; exact: boolean; prefix: boolean }
  | { type: "and"; children: QueryNode[] }
  | { type: "or"; children: QueryNode[] }
  | { type: "not"; child: QueryNode };

type Token =
  | { kind: "word"; value: string; star: boolean }
  | { kind: "phrase"; value: string; star: boolean }
  | { kind: "open" | "close" | "or" | "and" | "minus" | "plus" };

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.\-/%]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toHaystack(parts: Array<string | null | undefined>): string {
  return ` ${normalizeText(parts.filter(Boolean).join(" "))} `;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (ch === "(" || ch === ")") {
      tokens.push({ kind: ch === "(" ? "open" : "close" });
      i++;
    } else if (ch === '"') {
      const end = input.indexOf('"', i + 1);
      const value = input.slice(i + 1, end === -1 ? undefined : end);
      i = end === -1 ? input.length : end + 1;
      const star = input[i] === "*";
      if (star) i++;
      if (normalizeText(value)) tokens.push({ kind: "phrase", value: normalizeText(value), star });
    } else if ((ch === "-" || ch === "+") && (i === 0 || /[\s(]/.test(input[i - 1]))) {
      tokens.push({ kind: ch === "-" ? "minus" : "plus" });
      i++;
    } else {
      let j = i;
      while (j < input.length && !/[\s()"]/.test(input[j])) j++;
      const raw = input.slice(i, j);
      i = j;
      if (raw === "OR" || raw === "|") tokens.push({ kind: "or" });
      else if (raw === "AND" || raw === "&") tokens.push({ kind: "and" });
      else {
        const star = raw.endsWith("*");
        const value = normalizeText(star ? raw.slice(0, -1) : raw);
        if (value) tokens.push({ kind: "word", value, star });
      }
    }
  }
  return tokens;
}

export function parseQuery(input: string): QueryNode | null {
  const tokens = tokenize(input);
  let pos = 0;
  const peek = () => tokens[pos];

  const collapse = (type: "and" | "or", children: QueryNode[]): QueryNode | null =>
    children.length === 0 ? null : children.length === 1 ? children[0] : { type, children };

  function parseOr(): QueryNode | null {
    const children: QueryNode[] = [];
    const first = parseAnd();
    if (first) children.push(first);
    while (peek()?.kind === "or") {
      pos++;
      const next = parseAnd();
      if (next) children.push(next);
    }
    return collapse("or", children);
  }

  function parseAnd(): QueryNode | null {
    const children: QueryNode[] = [];
    while (pos < tokens.length) {
      const token = peek();
      if (token.kind === "or" || token.kind === "close") break;
      if (token.kind === "and") {
        pos++;
        continue;
      }
      const node = parseUnary();
      if (node) children.push(node);
    }
    return collapse("and", children);
  }

  function parseUnary(): QueryNode | null {
    const token = tokens[pos++];
    if (token.kind === "minus") {
      const child = pos < tokens.length ? parseUnary() : null;
      return child ? { type: "not", child } : null;
    }
    if (token.kind === "plus") return pos < tokens.length ? parseUnary() : null;
    if (token.kind === "open") {
      const inner = parseOr();
      if (peek()?.kind === "close") pos++;
      return inner;
    }
    if (token.kind === "word") return { type: "term", value: token.value, exact: false, prefix: true };
    if (token.kind === "phrase") return { type: "term", value: token.value, exact: true, prefix: token.star };
    return null;
  }

  const result = parseOr();
  return result;
}

const BOUNDARY = /[\s]/;

function matchTerm(haystack: string, value: string, prefix: boolean): boolean {
  let from = 0;
  const needle = ` ${value}`;
  while (true) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    const after = haystack[at + needle.length];
    if (prefix || after === undefined || BOUNDARY.test(after)) return true;
    from = at + 1;
  }
}

export type Matcher = (haystack: string) => boolean;

function compileNode(node: QueryNode): Matcher {
  switch (node.type) {
    case "term":
      return (h) => matchTerm(h, node.value, node.prefix);
    case "not": {
      const inner = compileNode(node.child);
      return (h) => !inner(h);
    }
    case "and": {
      const parts = node.children.map(compileNode);
      return (h) => parts.every((p) => p(h));
    }
    case "or": {
      const parts = node.children.map(compileNode);
      return (h) => parts.some((p) => p(h));
    }
  }
}

export function compileQuery(input: string): Matcher | null {
  const ast = parseQuery(input);
  return ast ? compileNode(ast) : null;
}

export function positiveTerms(node: QueryNode | null): string[] {
  if (!node) return [];
  if (node.type === "term") return [node.value];
  if (node.type === "not") return [];
  return node.children.flatMap(positiveTerms);
}
