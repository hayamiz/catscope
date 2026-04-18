"""File metadata scanner — walks a directory tree and collects statistics."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator


@dataclass
class FileStats:
    """Aggregated statistics for a collection of files."""

    total_files: int = 0
    total_bytes: int = 0
    by_extension: dict[str, int] = field(default_factory=dict)

    @property
    def avg_size(self) -> float:
        return self.total_bytes / self.total_files if self.total_files else 0.0

    def record(self, path: Path, size: int) -> None:
        self.total_files += 1
        self.total_bytes += size
        ext = path.suffix or "(none)"
        self.by_extension[ext] = self.by_extension.get(ext, 0) + 1


def walk_files(root: Path, ignore_hidden: bool = True) -> Iterator[Path]:
    """Yield all regular files under *root*, optionally skipping dotfiles."""
    for entry in sorted(root.rglob("*")):
        if ignore_hidden and any(p.startswith(".") for p in entry.parts):
            continue
        if entry.is_file():
            yield entry


def scan_directory(root: Path) -> FileStats:
    """Scan a directory tree and return aggregated file statistics."""
    stats = FileStats()
    for path in walk_files(root):
        stats.record(path, path.stat().st_size)
    return stats


if __name__ == "__main__":
    import sys

    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    result = scan_directory(target)
    print(f"Files: {result.total_files}")
    print(f"Total size: {result.total_bytes:,} bytes")
    print(f"Avg size: {result.avg_size:,.1f} bytes")
    for ext, count in sorted(result.by_extension.items(), key=lambda x: -x[1]):
        print(f"  {ext}: {count}")
