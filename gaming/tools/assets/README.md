# Stellaris Mod Builder — Artwork Sidecar (`assets/`)

This folder contains preview artwork used by the Stellaris Mod Builder. Place it
next to the built `stellaris-mod-builder-*.html` file; the app detects it
automatically. Without this folder the app runs identically, using its own
procedural placeholders and no game artwork.

## Copyright notice & disclaimer

**All artwork in this folder is the sole and exclusive property of Paradox
Interactive AB.** Every image is a direct format conversion (DDS → PNG) of
artwork from the game *Stellaris*, © Paradox Interactive AB. All copyrights,
trademarks, and other intellectual-property rights in and to the artwork,
*Stellaris*, and all related names, marks, and imagery are and remain vested
exclusively in Paradox Interactive AB and/or its licensors.

This artwork is reproduced here **strictly for preview and identification
purposes** — namely, to show users of the Stellaris Mod Builder how their
selections would render in-game. No ownership, authorship, originality, or
creative contribution to any of this artwork is claimed. No modification has
been made beyond technical format conversion. Its inclusion does not constitute
a challenge to, or dilution of, any rights held by Paradox Interactive AB.

The Stellaris Mod Builder is an **unofficial fan tool**. It is not affiliated
with, endorsed by, sponsored by, or in any way officially connected to Paradox
Interactive AB or any of its subsidiaries. Use of the artwork is intended to
fall within Paradox Interactive's User-Generated Content policy for
non-commercial fan projects. This material will be promptly removed upon
request of the rights holder.

Use of this folder assumes ownership of a legitimate copy of *Stellaris*.

## Folder layout

| Folder | Contents |
|---|---|
| `traits/` | Species trait icons (`trait_*.png`) |
| `traits/leader_trait_icons/` | Individual leader/ruler trait icons (unprefixed names) |
| `civics/` | Civic icons (`civic_*.png`) |
| `authorities/` | Authority icons (`auth_*.png`) |
| `origins/` | Origin icons (`origin_*.png`) |
| `ethics/` | Ethic icons (`ethic_*.png`, fanatic variants included) |
| `flags/<category>/` | Flag emblems by category (aquatic, human, imperial, …) |
| `flags/backgrounds/` | Flag background patterns, converted to alpha masks (alpha = the game's red colour channel) so the app can tint them |
| `planet_classes/` | Planet class icons, sliced from the game's `planet_type_icons.dds` spritesheet |
| `ui/` | Capability-axis icons used by the Empire Viewer (`cap_*.png`) |
| `manifest.json` | Machine-readable index of every file above |

Every folder above is actively loaded by the app. Earlier broader conversions
(species portraits, full `gfx/` tree mirror) were removed to keep this sidecar
to used-art-only.
