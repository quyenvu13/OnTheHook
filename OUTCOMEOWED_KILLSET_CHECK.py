"""
Kill-set + rubric gate for OutcomeOwed (project OnTheHook).

GATE 1  no token or bigram may separate the two classes.
GATE 2  the rubric may share no content word with any case.
        (No stemming: 'apply' and 'applied' look different to it, so a green
         gate still needs a human read of the rubric.)

Run:  python3 OUTCOMEOWED_KILLSET_CHECK.py
      python3 OUTCOMEOWED_KILLSET_CHECK.py contracts/OutcomeOwed.py
"""

import re
import sys

OTHER_LABEL = "the Client"

CASES = {
    "RESULT_OWED": {
        "D1": "We will use a dedicated team and the data will be fully migrated.",
        "D2": "We will deliver a signed audit certificate.",
        "D3": "The backlog will be cleared.",
        "D4": "We will apply every available method, and the licence will be approved.",
        "D5": "The site will be live on the new host.",
    },
    "EFFORT_OWED": {
        "E1": "We will use reasonable care in handling the data.",
        "E2": "We will keep trying to reach the supplier.",
        "E3": "The backlog will be worked on daily.",
        "E4": "We will pursue the licence application diligently.",
        "E5": "Best endeavours will be applied to the migration.",
    },
}

PAIRS = [
    ("D1", "E1", "both open with the same three words and both concern the same subject matter"),
    ("D3", "E3", "identical subject, identical passive opening"),
    ("D4", "E4", "both concern the same application, and D4 is full of effort vocabulary"),
    ("D2", "E5", "both name a concrete thing to be produced or acted on"),
    ("D5", "E2", "neither opens in the first person with a means clause"),
]


def features(text):
    tok = re.findall(r"[a-z]+", text.lower())
    f = set(tok)
    f.update(" ".join(p) for p in zip(tok, tok[1:]))
    return f


def leaks(case_set):
    sides = {k: {n: features(t) for n, t in v.items()} for k, v in case_set.items()}
    names = list(sides)
    out = []
    for i, name in enumerate(names):
        other = names[1 - i]
        common = set.intersection(*sides[name].values())
        absent = set().union(*sides[other].values())
        out += [(name, f) for f in sorted(common - absent)]
    return out


STOP = set("""a an and are as at be been by do does for from has have in into is it its
of on or our that the their them there these this to us we will with your you not no
if any each one two both same other than then when where which while who whom what""".split())


def content_words(text):
    return {w for w in re.findall(r"[a-z]+", text.lower())
            if w not in STOP and len(w) > 2}


flat = {**CASES["RESULT_OWED"], **CASES["EFFORT_OWED"]}

print("=" * 74)
print("DECLARED OTHER SIDE:", OTHER_LABEL)
print("=" * 74)

found = leaks(CASES)
if found:
    print(f"LEAK: {len(found)} separating feature(s) — set is NOT usable:")
    for side, f in found:
        print(f"   {f!r:34s} -> in ALL {side}, in NO case of the other class")
else:
    print("NO LEAK: no token or bigram separates the two classes.")

print()
print("Adversarial pairs (same surface, opposite label):")
for a, b, why in PAIRS:
    print(f"   {a} / {b}  - {why}")

print()
print("Byte length per case (255-byte calldata cliff; method name + 64-hex id add more):")
for name, text in sorted(flat.items()):
    n = len(text.encode("utf-8"))
    print(f"   {name}  {n:3d} bytes{'   <-- CHECK' if n > 150 else ''}")


def rubric_overlap(path):
    src = open(path, encoding="utf-8").read()
    m = re.search(r'RUBRIC\s*=\s*f?"""(.*?)"""', src, re.S)
    if not m:
        print("\ncould not find a RUBRIC block in", path)
        return 1
    cw = set()
    for t in flat.values():
        cw |= content_words(t)
    cw |= content_words(OTHER_LABEL)
    ov = sorted(content_words(m.group(1)) & cw)
    print()
    print("=" * 74)
    print("RUBRIC OVERLAP GATE —", path)
    print("=" * 74)
    if ov:
        print(f"FAIL: {len(ov)} content word(s) shared with the case set:")
        for w in ov:
            print("   ", w)
        print("The rubric defines the TASK. It never quotes an answer.")
        return 1
    print("PASS: rubric shares no content word with any case.")
    print("      (No stemming — read the rubric yourself for near-matches.)")
    return 0


print("=" * 74)
if len(sys.argv) > 1:
    sys.exit((1 if found else 0) or rubric_overlap(sys.argv[1]))
sys.exit(1 if found else 0)
