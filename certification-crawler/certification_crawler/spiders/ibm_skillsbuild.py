import json

import scrapy


class IbmSkillsBuildSpider(scrapy.Spider):
    name = "ibm_skillsbuild"
    allowed_domains = ["skillsbuild.org"]

    start_urls = [
        "https://skillsbuild.org/digital-credentials"
    ]

    def parse(self, response):
        self.logger.info("FINAL URL: %s", response.url)

        # IBM embeds the credential catalogue inside Next.js data.
        script = response.css("script#__NEXT_DATA__::text").get()

        if not script:
            self.logger.error("Could not find __NEXT_DATA__")
            return

        try:
            data = json.loads(script)
        except json.JSONDecodeError as error:
            self.logger.error(
                "Could not parse __NEXT_DATA__: %s",
                error,
            )
            return

        # Recursively find the JobSeekerBadge objects.
        badges = list(self.find_badges(data))

        self.logger.info(
            "Found %d credentials",
            len(badges),
        )

        for badge in badges:
            fields = badge.get("badgeFields") or {}

            domains = self.connection_names(
                badge.get("badgesDomains")
            )

            skill_areas = self.connection_names(
                badge.get("badgesSkillAreas")
            )

            types = self.connection_names(
                badge.get("badgesTypes")
            )

            # Use domains + skill areas as the searchable skills.
            skills = list(dict.fromkeys(
                domains + skill_areas
            ))

            # Use the first domain as the category.
            category = domains[0] if domains else None

            # Use the first credential type.
            certificate_type = (
                types[0] if types else "Digital Credential"
            )

            # Get the credential URL.
            url = fields.get("link")

            # The GradConnect API requires a URL.
            # Skip credentials that don't have one.
            if not url:
                self.logger.warning(
                    "Skipping %s because it has no URL",
                    badge.get("title"),
                )
                continue

            # Convert the IBM data into the format
            # expected by the GradConnect API.
            yield {
                "title": badge.get("title"),
                "provider": "IBM SkillsBuild",
                "description": fields.get("description"),
                "url": url,
                "source": "ibm_skillsbuild",
                "externalId": badge.get("id"),
                "category": category,
                "level": None,
                "duration": fields.get("duration"),
                "cost": "Free",
                "isFree": True,
                "certificateType": certificate_type,
                "skills": skills,
            }

    def find_badges(self, obj):
        """
        Recursively search the IBM JSON data for
        JobSeekerBadge objects.
        """

        if isinstance(obj, dict):

            if obj.get("__typename") == "JobSeekerBadge":
                yield obj

            for value in obj.values():
                yield from self.find_badges(value)

        elif isinstance(obj, list):

            for value in obj:
                yield from self.find_badges(value)

    @staticmethod
    def connection_names(obj):
        """
        Extract the name from each node in an IBM
        GraphQL connection.
        """

        if not obj:
            return []

        nodes = obj.get("nodes", [])

        return [
            node.get("name")
            for node in nodes
            if isinstance(node, dict)
            and node.get("name")
        ]