import requests


class GradConnectPipeline:
    def __init__(self, api_url, crawler):
        self.api_url = api_url
        self.crawler = crawler

    @classmethod
    def from_crawler(cls, crawler):
        api_url = crawler.settings.get("GRADCONNECT_API_URL")

        if not api_url:
            raise ValueError(
                "GRADCONNECT_API_URL is not configured"
            )

        return cls(
            api_url=api_url,
            crawler=crawler,
        )

    def process_item(self, item):
        response = requests.post(
            self.api_url,
            json=dict(item),
            timeout=30,
        )

        response.raise_for_status()

        spider = self.crawler.spider

        if spider:
            spider.logger.info(
                "Imported certification: %s",
                item.get("title"),
            )

        return item