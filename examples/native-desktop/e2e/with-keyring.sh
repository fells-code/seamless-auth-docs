#!/usr/bin/env bash
# Linux with no desktop session: starts a Secret Service for the command, with a keyring unlocked by
# a throwaway password, inside the D-Bus session dbus-run-session gave it.
set -euo pipefail

eval "$(printf 'not-a-secret\n' | gnome-keyring-daemon --unlock --components=secrets)"
export GNOME_KEYRING_CONTROL
exec "$@"
