import re

import scrapy


class MicrosoftAppliedSkillsSpider(scrapy.Spider):
    name = "microsoft_applied_skills"

    allowed_domains = [
        "learn.microsoft.com",
    ]

    # Microsoft currently exposes the Applied Skills
    # catalogue dynamically, so individual public
    # credential pages are used as crawl seeds.
    start_urls = [
        "https://learn.microsoft.com/en-us/credentials/applied-skills/get-started-with-identities-and-access-using-microsoft-entra/",
        "https://learn.microsoft.com/en-us/credentials/applied-skills/get-started-with-cloud-security-and-monitoring-tasks/",
        "https://learn.microsoft.com/en-us/credentials/applied-skills/get-started-with-azure-management-tasks/",
        "https://learn.microsoft.com/en-us/credentials/applied-skills/develop-an-agent-with-integrated-tools/",
        "https://learn.microsoft.com/en-us/credentials/applied-skills/secure-ai-solutions-in-the-cloud/",
        "https://learn.microsoft.com/en-us/credentials/applied-skills/streamline-business-workflows-with-ai-chat/",
        "https://learn.microsoft.com/en-us/credentials/applied-skills/get-started-developing-agents-in-microsoft-foundry/",
        "https://learn.microsoft.com/en-us/credentials/applied-skills/get-started-with-classes-properties-and-methods-in-c-sharp/",
    ]

    custom_settings = {
        "DOWNLOAD_DELAY": 1,
        "CONCURRENT_REQUESTS_PER_DOMAIN": 1,
    }

    def parse(self, response):
        self.logger.info(
            "Downloaded Microsoft Applied Skills credential: %s",
            response.url,
        )

        title = self.extract_title(response)

        if not title:
            self.logger.warning(
                "Could not extract credential title from %s",
                response.url,
            )
            return

        level = self.extract_field(
            response,
            "Level",
        )

        product = self.extract_field(
            response,
            "Product",
        )

        role = self.extract_field(
            response,
            "Role",
        )

        subject = self.extract_field(
            response,
            "Subject",
        )

        description = self.extract_description(
            response,
        )

        skills = self.build_skills(
            product=product,
            role=role,
            subject=subject,
            title=title,
        )

        category = self.category(
            product=product,
            subject=subject,
        )

        external_id = self.external_id(
            response.url
        )

        yield {
            "title": title,
            "provider": "Microsoft Learn",
            "description": description,
            "url": response.url,
            "source": "microsoft_applied_skills",
            "externalId": external_id,
            "category": category,
            "level": level,
            "duration": None,
            "cost": "Free",
            "isFree": True,
            "certificateType": "Applied Skills Credential",
            "skills": skills,
        }

    @staticmethod
    def extract_title(response):
        """
        Extract the actual credential title from
        Microsoft's H1.

        Example:

        Microsoft Applied Skills: Get started with
        identities and access using Microsoft Entra

        becomes:

        Get started with identities and access using
        Microsoft Entra
        """

        title = response.css(
            "h1::text"
        ).get()

        if not title:
            title = response.css(
                "h1 *::text"
            ).get()

        if not title:
            return None

        title = " ".join(
            title.split()
        )

        prefixes = [
            "Microsoft Applied Skills:",
            "Applied Skills:",
        ]

        for prefix in prefixes:
            if title.startswith(prefix):
                title = title[
                    len(prefix):
                ].strip()

        return title or None

    @staticmethod
    def all_clean_text(response):
        """
        Return visible text from the page with
        whitespace normalized.
        """

        values = response.css(
            "body *::text"
        ).getall()

        result = []

        for value in values:
            value = " ".join(
                value.split()
            )

            if value:
                result.append(value)

        return result

    def extract_field(
        self,
        response,
        label,
    ):
        """
        Extract fields from Microsoft's
        'At a glance' section.

        Expected structure:

        Level
        Beginner

        Product
        Microsoft Entra ID

        Role
        Administrator Identity and Access Administrator

        Subject
        Identity and access
        """

        text = self.all_clean_text(
            response
        )

        labels = {
            "level",
            "product",
            "role",
            "subject",
        }

        for index, value in enumerate(text):
            if value.lower() != label.lower():
                continue

            for offset in range(
                1,
                8,
            ):
                position = index + offset

                if position >= len(text):
                    break

                candidate = text[position]

                if not candidate:
                    continue

                if candidate.lower() in labels:
                    break

                # Ignore common navigation/UI text.
                if candidate.lower() in {
                    "at a glance",
                    "overview",
                    "prepare for the assessment",
                    "take the assessment",
                    "applied skills resources",
                }:
                    continue

                return candidate

        return None

    @staticmethod
    def extract_description(response):
        """
        Prefer Microsoft's meta description,
        then use the first useful overview paragraph.
        """

        description = response.css(
            'meta[name="description"]::attr(content)'
        ).get()

        if description:
            description = " ".join(
                description.split()
            )

            if description:
                return description

        paragraphs = response.css(
            "main p::text, article p::text, p::text"
        ).getall()

        for paragraph in paragraphs:
            paragraph = " ".join(
                paragraph.split()
            )

            if len(paragraph) >= 40:
                return paragraph

        return None

    @staticmethod
    def external_id(url):
        """
        Use the final URL segment as the stable
        external identifier.
        """

        value = url.rstrip(
            "/"
        ).split("/")[-1]

        return value or url

    @staticmethod
    def category(
        product,
        subject,
    ):
        value = " ".join(
            filter(
                None,
                [
                    product,
                    subject,
                ],
            )
        ).lower()

        if any(
            term in value
            for term in [
                "artificial intelligence",
                "generative ai",
                "generative",
                "copilot",
                "microsoft foundry",
            ]
        ):
            return "Artificial Intelligence"

        if any(
            term in value
            for term in [
                "security",
                "identity",
                "cyber",
            ]
        ):
            return "Cybersecurity"

        if any(
            term in value
            for term in [
                "data",
                "analytics",
            ]
        ):
            return "Data"

        if any(
            term in value
            for term in [
                "azure",
                "cloud",
            ]
        ):
            return "Cloud"

        if any(
            term in value
            for term in [
                "developer",
                ".net",
                "c#",
                "programming",
                "development",
            ]
        ):
            return "Development"

        if "database" in value:
            return "Databases"

        if "network" in value:
            return "Networking"

        return "Microsoft Technology"

    @staticmethod
    def build_skills(
        product,
        role,
        subject,
        title,
    ):
        skills = []

        values = [
            product,
            role,
            subject,
        ]

        for value in values:
            if not value:
                continue

            parts = re.split(
                r"[,;/]",
                value,
            )

            for part in parts:
                part = part.strip()

                if part:
                    skills.append(part)

        title_lower = title.lower()

        if (
            "artificial intelligence"
            in title_lower
        ):
            skills.append(
                "Artificial Intelligence"
            )

        if "ai" in title_lower:
            skills.append(
                "Artificial Intelligence"
            )

        if "copilot" in title_lower:
            skills.append(
                "Microsoft Copilot"
            )

        if "azure" in title_lower:
            skills.append(
                "Microsoft Azure"
            )

        if "c#" in title_lower:
            skills.append("C#")

        if "foundry" in title_lower:
            skills.append(
                "Microsoft Foundry"
            )

        return list(
            dict.fromkeys(
                skills
            )
        )