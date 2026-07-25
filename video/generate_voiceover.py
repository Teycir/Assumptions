import asyncio
import edge_tts
import subprocess

VOICE = "en-US-AvaNeural" # Premium female voice

NARRATIONS = {
    "scene1": "What is your code silently assuming? Most production failures are not caused by broken syntax, but by unverified assumptions.",
    "scene2": "Here is a real case from our duplicate checkout fixture. This payment endpoint calls stripe.charges.create without an idempotency key, assuming requests only arrive once.",
    "scene3": "Assumptions scans your code diff and produces an evidence-backed ledger. Every finding cites exact file and line locators, explicit P0 to P3 priorities, and marks uninspected paths as Unknown rather than guessing.",
    "scene4": "Every finding ships with a concrete falsification test to prove the failure mode, and a recommended control you can verify before release. Assumptions never auto-mutates your codebase.",
    "scene5": "Ship with confidence. Run slash assumptions-scan in your code review workflow, fully local and open source."
}

async def generate():
    for name, text in NARRATIONS.items():
        output_file = f"/home/teycir/Repos/Assumptions/video/public/audio/narration/{name}.mp3"
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(output_file)
        print(f"Generated {name}.mp3")

        # Get duration using ffprobe
        res = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", output_file
        ], capture_output=True, text=True)
        print(f"  Duration: {res.stdout.strip()} s")

if __name__ == "__main__":
    import os
    os.makedirs("/home/teycir/Repos/Assumptions/video/public/audio/narration", exist_ok=True)
    asyncio.run(generate())
