"""Approval-gated future command; never prints or writes generated passwords.

Creates versions on the TWO EXISTING demonstration password secrets only.
It does not rotate SQL rows, deploy services, alter IAM or retrieve secret values.
"""
import argparse
import json
import os
import re
import secrets
import shutil
import subprocess
import sys

PROJECT = "cpe334-workflow-approval-2026"
PROJECT_NUMBER = "597719179612"
SECRET_NAMES = ("workflow-requester-password", "workflow-reviewer-password")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--approve-secret-writes", action="store_true", help="Explicitly approve adding two secret versions")
    args = parser.parse_args()
    if not args.approve_secret_writes:
        parser.error("No cloud operation performed. Explicit --approve-secret-writes is required.")

    gcloud = shutil.which("gcloud.cmd") or shutil.which("gcloud")
    if not gcloud:
        raise RuntimeError("gcloud is not on PATH; no cloud operation performed.")
    created: dict[str, str] = {}

    def run(arguments: list[str], payload: bytes | None = None) -> str:
        # On Windows gcloud is a .cmd wrapper. All arguments are fixed public
        # identifiers; password bytes travel only through redirected stdin.
        result = subprocess.run([gcloud, *arguments], input=payload, capture_output=True,
                                shell=os.name == "nt", check=False)
        if result.returncode:
            raise RuntimeError(f"gcloud failed with exit {result.returncode}; stop and inspect permissions. Raw stderr withheld.")
        return result.stdout.decode("utf-8").strip()

    try:
        active = run(["config", "get-value", "project", "--quiet"])
        number = run(["projects", "describe", PROJECT, "--format=value(projectNumber)", "--quiet"])
        account = run(["auth", "list", "--filter=status:ACTIVE", "--format=value(account)", "--quiet"])
        if active != PROJECT or number != PROJECT_NUMBER or not account or "\n" in account:
            raise RuntimeError("Active account/project preflight did not match the approved project.")
        # Confirm both existing secrets before any write; never create a secret.
        for name in SECRET_NAMES:
            run(["secrets", "describe", name, f"--project={PROJECT}", "--format=value(name)", "--quiet"])

        first = secrets.token_urlsafe(36)
        second = secrets.token_urlsafe(36)
        while first == second:
            second = secrets.token_urlsafe(36)
        for name, value in zip(SECRET_NAMES, (first, second), strict=True):
            reference = run(["secrets", "versions", "add", name, f"--project={PROJECT}",
                             "--data-file=-", "--format=value(name)", "--quiet"], value.encode("utf-8"))
            if not re.fullmatch(rf"projects/(?:{PROJECT}|{PROJECT_NUMBER})/secrets/{name}/versions/[1-9][0-9]*", reference):
                raise RuntimeError("Unexpected secret-version response; stop without creating further versions.")
            created[name] = reference.rsplit("/", 1)[1]
        print(json.dumps({"project": PROJECT, "new_versions": created,
                          "database_rotation": "PENDING; execute the separately approved one-shot job with these exact versions"}))
        return 0
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        print(json.dumps({"created_versions": created, "database_rotation": "NOT PERFORMED",
                          "action": "STOP; retain these version IDs and do not recreate or auto-delete them"}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
