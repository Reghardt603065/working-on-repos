import scrapy


class CertificationItem(scrapy.Item):
    title = scrapy.Field()
    provider = scrapy.Field()
    description = scrapy.Field()

    url = scrapy.Field()
    source = scrapy.Field()
    externalId = scrapy.Field()

    category = scrapy.Field()
    level = scrapy.Field()
    duration = scrapy.Field()

    cost = scrapy.Field()
    isFree = scrapy.Field()

    certificateType = scrapy.Field()
    skills = scrapy.Field()