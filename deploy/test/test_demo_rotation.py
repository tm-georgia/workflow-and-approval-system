import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location("rotation", Path(__file__).parents[1] / "prepare-demo-rotation.py")
rotation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rotation)


class RotationPreparationTests(unittest.TestCase):
    def invoke(self, *, project=rotation.PROJECT, fail_second=False):
        calls = []
        secret_payloads = []

        def fake_run(command, *, input, **_kwargs):
            calls.append(command)
            if command[1:4] == ["config", "get-value", "project"]:
                answer = project
            elif command[1:3] == ["projects", "describe"]:
                answer = rotation.PROJECT_NUMBER
            elif command[1:3] == ["auth", "list"]:
                answer = "operator@example.test"
            elif command[1:3] == ["secrets", "describe"]:
                answer = command[3]
            elif command[1:4] == ["secrets", "versions", "add"]:
                secret_payloads.append(input)
                if fail_second and command[4] == "workflow-reviewer-password":
                    return subprocess.CompletedProcess(command, 1, b"", b"sensitive raw error must not be printed")
                answer = f"projects/{rotation.PROJECT_NUMBER}/secrets/{command[4]}/versions/2"
            else:
                raise AssertionError("Unexpected cloud command")
            return subprocess.CompletedProcess(command, 0, answer.encode(), b"")

        output, errors = io.StringIO(), io.StringIO()
        with patch("sys.argv", ["prepare-demo-rotation.py", "--approve-secret-writes"]), \
                patch.object(rotation.shutil, "which", return_value="gcloud.cmd"), \
                patch.object(rotation.subprocess, "run", side_effect=fake_run), \
                patch.object(rotation.secrets, "token_urlsafe", side_effect=["synthetic-first-" + "a" * 32, "synthetic-second-" + "b" * 32]), \
                contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
            status = rotation.main()
        return status, output.getvalue(), errors.getvalue(), calls, secret_payloads

    def test_requires_explicit_approval_before_any_cloud_command(self):
        with patch("sys.argv", ["prepare-demo-rotation.py"]), \
                patch.object(rotation.subprocess, "run") as cloud, \
                contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            rotation.main()
        cloud.assert_not_called()

    def test_creates_only_two_existing_secret_versions_with_exact_stdin_bytes(self):
        status, output, errors, calls, payloads = self.invoke()
        self.assertEqual(status, 0)
        self.assertEqual(errors, "")
        metadata = json.loads(output)
        self.assertEqual(metadata["new_versions"], {name: "2" for name in rotation.SECRET_NAMES})
        self.assertEqual(len(payloads), 2)
        self.assertTrue(all(value and not value.endswith(b"\n") for value in payloads))
        self.assertNotEqual(*payloads)
        for value in payloads:
            self.assertNotIn(value.decode(), output + errors)
            self.assertTrue(all(value.decode() not in argument for command in calls for argument in command))
        self.assertFalse(any("create" in command or "access" in command for command in calls))

    def test_wrong_active_project_fails_before_secret_writes(self):
        status, output, errors, _calls, payloads = self.invoke(project="other-project")
        self.assertEqual(status, 1)
        self.assertEqual(output, "")
        self.assertEqual(payloads, [])
        self.assertIn("NOT PERFORMED", errors)

    def test_partial_secret_version_failure_reports_only_public_version_metadata(self):
        status, output, errors, _calls, payloads = self.invoke(fail_second=True)
        self.assertEqual(status, 1)
        self.assertEqual(output, "")
        self.assertIn('"workflow-requester-password": "2"', errors)
        self.assertNotIn("sensitive raw error", errors)
        self.assertTrue(all(value.decode() not in errors for value in payloads))
        self.assertIn("NOT PERFORMED", errors)


if __name__ == "__main__":
    unittest.main()
