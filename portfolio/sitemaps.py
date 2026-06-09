from django.contrib.sitemaps import Sitemap
from django.urls import reverse


class StaticViewSitemap(Sitemap):
    priority = 0.8
    changefreq = "monthly"

    def items(self):
        return [
            "index",
            "projectGallery_index",
            "blog_index",
            "naga_index",
            "perfume_index",
            "hobbits_index",
            "mediaServer_index",
        ]

    def location(self, item):
        return reverse(item)
