import hashlib
import importlib.util
import pathlib
import sys
import types
import unittest

from Crypto.Hash import keccak


ROOT = pathlib.Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "contracts" / "OutcomeOwed.py"

AUTHOR = "0x1111111111111111111111111111111111111111"
OTHER = "0x2222222222222222222222222222222222222222"
OUTSIDER = "0x3333333333333333333333333333333333333333"
LABEL = "the Client"


class UserError(Exception):
    pass


class Return:
    def __init__(self, calldata):
        self.calldata = calldata


class U256(int):
    pass


class TreeMap(dict):
    pass


class Keccak256:
    def __init__(self, value):
        self._hash = keccak.new(digest_bits=256, data=value)

    def hexdigest(self):
        return self._hash.hexdigest()


class Public:
    @staticmethod
    def write(function):
        return function

    @staticmethod
    def view(function):
        return function


def install_genlayer_stub():
    module = types.ModuleType("genlayer")
    message = types.SimpleNamespace(sender_address=AUTHOR)
    nondet = types.SimpleNamespace(exec_prompt=lambda *_args, **_kwargs: None)

    def run_nondet_unsafe(leader_fn, validator_fn):
        leader_result = Return(leader_fn())
        if not validator_fn(leader_result):
            raise UserError("Validator disagreement")
        return leader_result

    vm = types.SimpleNamespace(
        UserError=UserError,
        Return=Return,
        run_nondet_unsafe=run_nondet_unsafe,
    )
    gl = types.SimpleNamespace(
        Contract=object,
        message=message,
        nondet=nondet,
        vm=vm,
        public=Public(),
    )

    def allow_storage(cls):
        return cls

    module.gl = gl
    module.Address = str
    module.u256 = U256
    module.TreeMap = TreeMap
    module.Keccak256 = Keccak256
    module.allow_storage = allow_storage
    module.__all__ = [
        "gl",
        "Address",
        "u256",
        "TreeMap",
        "Keccak256",
        "allow_storage",
    ]
    sys.modules["genlayer"] = module
    return gl


GL = install_genlayer_stub()
SPEC = importlib.util.spec_from_file_location("outcome_owed_contract", CONTRACT_PATH)
CONTRACT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CONTRACT)


class OutcomeOwedTests(unittest.TestCase):
    def setUp(self):
        GL.message.sender_address = AUTHOR
        self.contract = CONTRACT.OutcomeOwed()
        self.contract.undertakings = TreeMap()
        self.contract.log_note = TreeMap()
        self.contract.log_by = TreeMap()
        self.prompt_calls = []
        self.set_prompt_result({"outcome": CONTRACT.EFFORT_OWED})

    def set_prompt_result(self, result):
        def _exec(prompt, **kwargs):
            self.prompt_calls.append((prompt, kwargs))
            return result

        GL.nondet.exec_prompt = _exec

    def open(self, text, outcome=CONTRACT.EFFORT_OWED, wallet=OTHER):
        self.set_prompt_result({"outcome": outcome})
        self.contract.open_undertaking(wallet, LABEL, text)
        normalized = self.contract._normalize_text(text.strip())
        return self.contract._undertaking_id_for(AUTHOR, normalized)

    def test_locked_header_surface_and_no_preview(self):
        lines = CONTRACT_PATH.read_text(encoding="utf-8").splitlines()
        self.assertEqual(lines[0], "# v0.2.16")
        self.assertEqual(
            lines[1],
            '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }',
        )
        self.assertEqual(lines[2], "")
        self.assertEqual(lines[3], "from genlayer import *")

        methods = CONTRACT.OutcomeOwed.__dict__
        expected = (
            "open_undertaking",
            "claim_discharge",
            "rebut",
            "log_entry",
            "get_undertaking",
            "get_log_entry",
            "get_log",
            "get_rubric",
            "get_limits",
        )
        for name in expected:
            self.assertIn(name, methods)
        for prefix in ("preview_", "classify_", "dry_run_"):
            self.assertFalse(any(name.startswith(prefix) for name in methods))

    def test_locked_constants(self):
        cls = CONTRACT.OutcomeOwed
        self.assertEqual(cls.MAX_TEXT_LENGTH, 600)
        self.assertEqual(cls.MAX_LABEL_LENGTH, 80)
        self.assertEqual(cls.MAX_NOTE_LENGTH, 300)
        self.assertEqual(cls.MAX_LOG_ENTRIES, 30)
        self.assertEqual(cls.MAX_PAGE_SIZE, 50)

    def test_rubric_is_fixed(self):
        self.assertEqual(
            hashlib.sha256(CONTRACT.RUBRIC.encode("utf-8")).hexdigest(),
            "673ec971745a2f6a6c0f14ab4b64d1ef97a4ae7e89f589dd80b613a0b259c358",
        )

    def test_other_wallet_equal_author_reverts_before_model(self):
        with self.assertRaisesRegex(UserError, "cannot be the author"):
            self.contract.open_undertaking(
                AUTHOR.upper().replace("0X", "0x"), LABEL, "A valid promise."
            )
        self.assertEqual(self.prompt_calls, [])

    def test_wallet_validation_and_case_normalization(self):
        for wallet in ("", "0x1234", "0x" + "g" * 40, CONTRACT.ZERO_ADDRESS):
            with self.subTest(wallet=wallet):
                with self.assertRaises(UserError):
                    self.contract.open_undertaking(wallet, LABEL, "A valid promise.")

        mixed = "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa"
        undertaking_id = self.open("A normalized wallet promise.", wallet=mixed)
        self.assertEqual(
            self.contract.undertakings[undertaking_id].other_wallet,
            mixed.lower(),
        )

    def test_reserved_tokens_rejected_in_text_and_label(self):
        for token in CONTRACT.RESERVED_TOKENS:
            with self.subTest(field="text", token=token):
                with self.assertRaisesRegex(UserError, "reserved"):
                    self.contract.open_undertaking(
                        OTHER, LABEL, "alpha " + token.lower() + " omega"
                    )
            with self.subTest(field="label", token=token):
                with self.assertRaisesRegex(UserError, "reserved"):
                    self.contract.open_undertaking(
                        OTHER, "client " + token.lower(), "A valid promise."
                    )

    def test_fixed_point_fence_strip_removes_reconstructed_marker(self):
        dirty = "alpha <UNTRUSTED_<UNTRUSTED_UNDERTAKING_TEXT>UNDERTAKING_TEXT> omega"
        cleaned = self.contract._fence_strip(dirty)
        self.assertNotIn(CONTRACT.TEXT_OPEN, cleaned.upper())
        self.assertIn("alpha", cleaned)
        self.assertIn("omega", cleaned)

    def test_whitespace_variants_share_id_and_duplicate_reverts(self):
        text = "  Alpha\t\n beta\x1c gamma  "
        undertaking_id = self.open(text, CONTRACT.RESULT_OWED)
        expected = self.contract._undertaking_id_for(AUTHOR, "Alpha beta gamma")
        self.assertEqual(undertaking_id, expected)
        self.assertEqual(
            self.contract.undertakings[undertaking_id].text,
            "Alpha\t\n beta\x1c gamma",
        )
        calls = len(self.prompt_calls)
        with self.assertRaisesRegex(UserError, "already exists"):
            self.contract.open_undertaking(
                OTHER, "a different label", "Alpha  beta\u0085gamma"
            )
        self.assertEqual(len(self.prompt_calls), calls)

    def test_identity_uses_keccak_256(self):
        normalized = "The backlog will be cleared."
        payload = (
            "OUTCOME_OWED:UNDERTAKING:V1|"
            + AUTHOR.lower()
            + "|"
            + str(len(normalized))
            + "|"
            + normalized
        ).encode("utf-8")
        expected = keccak.new(digest_bits=256, data=payload).hexdigest()
        self.assertEqual(
            self.contract._undertaking_id_for(AUTHOR, normalized), expected
        )

    def test_prompt_contains_only_two_semantic_inputs_and_json_mode(self):
        text = "The backlog will be cleared."
        self.open(text, CONTRACT.RESULT_OWED)
        prompt, kwargs = self.prompt_calls[0]
        self.assertIn(LABEL, prompt)
        self.assertIn(text, prompt)
        self.assertIn(CONTRACT.TEXT_OPEN, prompt)
        self.assertIn(CONTRACT.SIDE_OPEN, prompt)
        self.assertNotIn(AUTHOR.lower(), prompt.lower())
        self.assertNotIn(OTHER.lower(), prompt.lower())
        self.assertEqual(kwargs, {"response_format": "json"})

    def test_malformed_unknown_output_fails_safe_to_effort(self):
        bad = ("not-json", [], {"outcome": "MAYBE"}, {"wrong": "RESULT_OWED"}, None)
        for index, result in enumerate(bad):
            with self.subTest(result=result):
                self.setUp()
                self.set_prompt_result(result)
                text = "Unique fallback promise " + str(index)
                self.contract.open_undertaking(OTHER, LABEL, text)
                undertaking_id = self.contract._undertaking_id_for(
                    AUTHOR, self.contract._normalize_text(text)
                )
                record = self.contract.undertakings[undertaking_id]
                self.assertEqual(record.kind, CONTRACT.EFFORT)
                self.assertEqual(record.state, CONTRACT.RUNNING)
                self.assertEqual(
                    self.contract._outcome_label(record.outcome),
                    CONTRACT.EFFORT_OWED,
                )

    def test_validator_disagreement_reverts_without_storage(self):
        results = iter((
            {"outcome": CONTRACT.RESULT_OWED},
            {"outcome": CONTRACT.EFFORT_OWED},
        ))
        GL.nondet.exec_prompt = lambda *_args, **_kwargs: next(results)
        with self.assertRaisesRegex(UserError, "Validator disagreement"):
            self.contract.open_undertaking(OTHER, LABEL, "A disputed promise.")
        self.assertEqual(dict(self.contract.undertakings), {})

    def test_outsider_cannot_claim_discharge(self):
        undertaking_id = self.open("A result promise.", CONTRACT.RESULT_OWED)
        GL.message.sender_address = OUTSIDER
        with self.assertRaisesRegex(UserError, "Only the author"):
            self.contract.claim_discharge(undertaking_id, "Done.")

    def test_outsider_cannot_rebut(self):
        undertaking_id = self.open("A result promise.", CONTRACT.RESULT_OWED)
        self.contract.claim_discharge(undertaking_id, "Done.")
        GL.message.sender_address = OUTSIDER
        with self.assertRaisesRegex(UserError, "Only the named other side"):
            self.contract.rebut(undertaking_id, "Disputed.")

    def test_outsider_cannot_add_log_entry(self):
        undertaking_id = self.open("An effort promise.", CONTRACT.EFFORT_OWED)
        GL.message.sender_address = OUTSIDER
        with self.assertRaisesRegex(UserError, "Only the two named sides"):
            self.contract.log_entry(undertaking_id, "Unknown writer.")

    def test_rebut_before_claim_reverts(self):
        undertaking_id = self.open("A result promise.", CONTRACT.RESULT_OWED)
        GL.message.sender_address = OTHER
        with self.assertRaisesRegex(UserError, "There is no claim to rebut"):
            self.contract.rebut(undertaking_id, "Too early.")

    def test_result_shape_claim_once_rebut_once_and_settles(self):
        undertaking_id = self.open("A result promise.", CONTRACT.RESULT_OWED)
        with self.assertRaisesRegex(UserError, "discharged by a claim"):
            self.contract.log_entry(undertaking_id, "Wrong shape.")

        self.contract.claim_discharge(undertaking_id, "Completed.")
        record = self.contract.undertakings[undertaking_id]
        self.assertEqual(record.state, CONTRACT.CLAIMED)
        self.assertEqual(record.claim_note, "Completed.")

        with self.assertRaisesRegex(UserError, "already been claimed"):
            self.contract.claim_discharge(undertaking_id, "Again.")

        GL.message.sender_address = OTHER
        self.contract.rebut(undertaking_id, "The result is disputed.")
        record = self.contract.undertakings[undertaking_id]
        self.assertEqual(record.state, CONTRACT.SETTLED)
        self.assertEqual(record.rebut_note, "The result is disputed.")

        with self.assertRaisesRegex(UserError, "There is no claim to rebut"):
            self.contract.rebut(undertaking_id, "Second rebuttal.")

    def test_effort_shape_rejects_claim_and_rebut(self):
        undertaking_id = self.open("An effort promise.", CONTRACT.EFFORT_OWED)
        with self.assertRaisesRegex(UserError, "standing obligation"):
            self.contract.claim_discharge(undertaking_id, "Done.")
        GL.message.sender_address = OTHER
        with self.assertRaisesRegex(UserError, "standing obligation"):
            self.contract.rebut(undertaking_id, "No claim exists.")

    def test_effort_log_is_two_sided_and_never_closes(self):
        undertaking_id = self.open("An effort promise.", CONTRACT.EFFORT_OWED)
        self.contract.log_entry(undertaking_id, "Author update.")
        GL.message.sender_address = OTHER
        self.contract.log_entry(undertaking_id, "Other-side update.")

        record = self.contract.undertakings[undertaking_id]
        self.assertEqual(record.state, CONTRACT.RUNNING)
        self.assertEqual(int(record.log_count), 2)
        self.assertEqual(self.contract.get_log_entry(undertaking_id, 1)["by"], AUTHOR)
        self.assertEqual(self.contract.get_log_entry(undertaking_id, 2)["by"], OTHER)
        self.assertEqual(
            [entry["index"] for entry in self.contract.get_log(undertaking_id, 0, 10)],
            [1, 2],
        )

    def test_log_full_reverts_without_closing(self):
        undertaking_id = self.open("An effort promise.", CONTRACT.EFFORT_OWED)
        record = self.contract.undertakings[undertaking_id]
        record.log_count = U256(self.contract.MAX_LOG_ENTRIES)
        self.contract.undertakings[undertaking_id] = record
        with self.assertRaisesRegex(UserError, "Log is full"):
            self.contract.log_entry(undertaking_id, "One too many.")
        self.assertEqual(
            self.contract.undertakings[undertaking_id].state,
            CONTRACT.RUNNING,
        )

    def test_input_lengths_ids_notes_and_pages_are_checked(self):
        with self.assertRaisesRegex(UserError, "label is too long"):
            self.contract.open_undertaking(OTHER, "x" * 81, "A valid promise.")
        with self.assertRaisesRegex(UserError, "text is too long"):
            self.contract.open_undertaking(OTHER, LABEL, "x" * 601)

        undertaking_id = self.open("An effort promise.", CONTRACT.EFFORT_OWED)
        with self.assertRaisesRegex(UserError, "Note is too long"):
            self.contract.log_entry(undertaking_id, "x" * 301)
        with self.assertRaisesRegex(UserError, "Invalid undertaking id"):
            self.contract.get_undertaking("not-a-hash")
        with self.assertRaisesRegex(UserError, "Invalid page size"):
            self.contract.get_log(undertaking_id, 0, 51)
        with self.assertRaisesRegex(UserError, "Offset cannot be negative"):
            self.contract.get_log(undertaking_id, -1, 1)

    def test_views_expose_exact_record_shape_and_limits(self):
        result_id = self.open("A result promise.", CONTRACT.RESULT_OWED)
        view = self.contract.get_undertaking(result_id)
        self.assertEqual(view["outcome"], CONTRACT.RESULT_OWED)
        self.assertEqual(view["kind"], CONTRACT.RESULT)
        self.assertEqual(view["state"], CONTRACT.OPEN)
        self.assertEqual(view["log_count"], 0)

        limits = self.contract.get_limits()
        self.assertEqual(limits["contract_name"], "OutcomeOwed")
        self.assertEqual(limits["version"], "1.0")
        self.assertFalse(limits["global_admin"])
        self.assertFalse(limits["clock_used"])
        self.assertFalse(limits["external_web_used"])
        self.assertFalse(limits["money_used"])
        self.assertFalse(limits["preview_endpoint_exposed"])


if __name__ == "__main__":
    unittest.main()
