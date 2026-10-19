"""In-memory cache with Time-To-Live (TTL) expiration and Least Recently Used (LRU) eviction.

Used for high-frequency, read-heavy queries such as user profile cards to reduce
repeated database round-trips while keeping memory usage bounded and predictable.
"""
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any, Optional


class TTLLRUCache:
    """A thread-safe-friendly LRU cache with per-item TTL expiration."""

    def __init__(self, maxsize: int = 500, ttl_seconds: int = 300):
        self.maxsize = maxsize
        self.ttl_seconds = ttl_seconds
        self._cache: OrderedDict[Any, tuple[float, Any]] = OrderedDict()

    def _now(self) -> float:
        return datetime.now(timezone.utc).timestamp()

    def get(self, key: Any) -> Optional[Any]:
        """Retrieve value by key if present and unexpired, updating recency."""
        if key not in self._cache:
            return None

        expiry, value = self._cache[key]
        if self._now() > expiry:
            # Expired: evict from cache
            del self._cache[key]
            return None

        # Move to end to mark as recently used
        self._cache.move_to_end(key)
        return value

    def set(self, key: Any, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Store value with calculated expiration timestamp, evicting oldest if full."""
        ttl = ttl_seconds if ttl_seconds is not None else self.ttl_seconds
        expiry = self._now() + ttl

        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = (expiry, value)

        # Evict least-recently-used item if over capacity
        if len(self._cache) > self.maxsize:
            self._cache.popitem(last=False)

    def invalidate(self, key: Any) -> None:
        """Explicitly purge a cached entry (e.g., when profile is modified or deleted)."""
        self._cache.pop(key, None)

    def clear(self) -> None:
        """Clear all entries."""
        self._cache.clear()

    def __len__(self) -> int:
        return len(self._cache)


# Global profile cache instance: up to 500 user profiles, cached for 5 minutes (300 seconds)
profile_cache = TTLLRUCache(maxsize=500, ttl_seconds=300)
