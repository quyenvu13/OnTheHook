import assert from "node:assert/strict";
import test from "node:test";
import {
  pyLen,
  pyNormalize,
  pyStrip,
  undertakingId
} from "../src/lib/id.js";

const whitespaceCases = [
  ["spaces", "  alpha   beta  "],
  ["tab-newline", "\talpha\nbeta\r\n"],
  ["U+001C", "\u001calpha\u001cbeta\u001c"],
  ["U+001D", "\u001dalpha\u001dbeta\u001d"],
  ["U+001E", "\u001ealpha\u001ebeta\u001e"],
  ["U+001F", "\u001falpha\u001fbeta\u001f"],
  ["U+0085", "\u0085alpha\u0085beta\u0085"],
  ["U+00A0", "\u00a0alpha\u00a0beta\u00a0"],
  ["U+1680", "\u1680alpha\u1680beta\u1680"],
  ["U+2007", "\u2007alpha\u2007beta\u2007"],
  ["U+2028", "\u2028alpha\u2028beta\u2028"],
  ["U+2029", "\u2029alpha\u2029beta\u2029"],
  ["U+202F", "\u202falpha\u202fbeta\u202f"],
  ["U+205F", "\u205falpha\u205fbeta\u205f"],
  ["U+3000", "\u3000alpha\u3000beta\u3000"]
];

for (const [name, value] of whitespaceCases) {
  test("Python whitespace parity: " + name, () => {
    assert.equal(pyStrip(value).startsWith("alpha"), true);
    assert.equal(pyNormalize(value), "alpha beta");
  });
}

test("Python length counts code points, not UTF-16 units", () => {
  assert.equal(pyLen("A😀B"), 3);
});

test("all Python whitespace variants derive one ID", () => {
  const author = "0x1111111111111111111111111111111111111111";
  const expected = undertakingId(author, "alpha beta");
  for (const [, value] of whitespaceCases) {
    assert.equal(undertakingId(author, value), expected);
  }
});

test("D3 ID matches the frozen contract vector", () => {
  const author = "0x923a09d0D6e5C242e36C3c1D2071835917cC0bDF";
  assert.equal(
    undertakingId(author, "The backlog will be cleared."),
    "2524e0f7a877a53d1efeaf4cc58491dee0d5ea71c66135398c0c5a767c24452f"
  );
});

test("E3 ID matches the frozen contract vector", () => {
  const author = "0x923a09d0D6e5C242e36C3c1D2071835917cC0bDF";
  assert.equal(
    undertakingId(author, "The backlog will be worked on daily."),
    "88ddebfc95caf86104a2cb4547593d85b37db1a85aca055c7e5ac01395a3de8d"
  );
});
