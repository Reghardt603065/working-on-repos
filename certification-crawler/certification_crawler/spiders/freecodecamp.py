import json

import scrapy


class FreeCodeCampSpider(scrapy.Spider):
    name = "freecodecamp"

    allowed_domains = [
        "raw.githubusercontent.com",
    ]

    start_urls = [
        (
            "https://raw.githubusercontent.com/"
            "freeCodeCamp/freeCodeCamp/main/"
            "curriculum/structure/curriculum.json"
        )
    ]

    # These are legacy certifications that should not appear
    # in the GradConnect catalogue.
    EXCLUDED_CERTIFICATIONS = {
        "javascript-algorithms-and-data-structures-v8",
        "legacy-back-end",
        "legacy-data-visualization",
        "legacy-front-end",
        "legacy-full-stack",
        "legacy-information-security-and-quality-assurance",
    }

    # When both an older certification and a current v9
    # certification exist, prefer the v9 version.
    V9_REPLACEMENTS = {
        "responsive-web-design":
            "responsive-web-design-v9",

        "javascript-algorithms-and-data-structures":
            "javascript-v9",

        "front-end-development-libraries":
            "front-end-development-libraries-v9",

        "relational-database":
            "relational-databases-v9",

        "back-end-development-and-apis":
            "back-end-development-and-apis-v9",
    }

    TITLES = {
        "responsive-web-design-v9":
            "Responsive Web Design",

        "javascript-v9":
            "JavaScript",

        "front-end-development-libraries-v9":
            "Front End Development Libraries",

        "python-v9":
            "Python",

        "relational-databases-v9":
            "Relational Databases",

        "back-end-development-and-apis-v9":
            "Back End Development and APIs",

        "full-stack-developer-v9":
            "Full Stack Developer",

        "data-analysis-with-python":
            "Data Analysis with Python",

        "data-visualization":
            "Data Visualization",

        "scientific-computing-with-python":
            "Scientific Computing with Python",

        "machine-learning-with-python":
            "Machine Learning with Python",

        "college-algebra-with-python":
            "College Algebra with Python",

        "information-security":
            "Information Security",

        "quality-assurance":
            "Quality Assurance",

        "foundational-c-sharp-with-microsoft":
            "Foundational C# with Microsoft",

        "a2-english-for-developers":
            "A2 English for Developers",

        "b1-english-for-developers":
            "B1 English for Developers",

        "a1-professional-chinese":
            "A1 Professional Chinese",

        "a2-professional-chinese":
            "A2 Professional Chinese",

        "a2-professional-spanish":
            "A2 Professional Spanish",
    }

    def parse(self, response):
        self.logger.info(
            "Downloaded freeCodeCamp curriculum data"
        )

        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as error:
            self.logger.error(
                "Could not parse curriculum.json: %s",
                error,
            )
            return

        certifications = data.get(
            "certifications",
            [],
        )

        self.logger.info(
            "Found %d certification entries before filtering",
            len(certifications),
        )

        selected = self.select_certifications(
            certifications
        )

        self.logger.info(
            "Selected %d current certifications",
            len(selected),
        )

        for cert_id in selected:
            yield self.build_certification(
                cert_id
            )

    def select_certifications(
        self,
        certifications,
    ):
        """
        Select the current, useful certifications.

        Removes:
        - legacy certifications
        - javascript v8
        - older versions replaced by v9
        """

        selected = []

        certification_ids = {
            cert
            for cert in certifications
            if isinstance(cert, str)
        }

        for cert_id in certification_ids:
            if cert_id in self.EXCLUDED_CERTIFICATIONS:
                self.logger.info(
                    "Skipping legacy certification: %s",
                    cert_id,
                )
                continue

            replacement = self.V9_REPLACEMENTS.get(
                cert_id
            )

            if replacement and replacement in certification_ids:
                self.logger.info(
                    "Skipping %s because %s is the current version",
                    cert_id,
                    replacement,
                )
                continue

            selected.append(cert_id)

        return sorted(selected)

    def build_certification(self, cert_id):
        title = self.TITLES.get(
            cert_id,
            self.title_from_id(cert_id),
        )

        category = self.category_from_id(
            cert_id
        )

        skills = self.skills_from_id(
            cert_id
        )

        return {
            "title": title,
            "provider": "freeCodeCamp",
            "description": self.description_for(
                cert_id,
                title,
            ),
            "url": (
                "https://www.freecodecamp.org/"
                f"learn/{cert_id}/"
            ),
            "source": "freecodecamp",
            "externalId": cert_id,
            "category": category,
            "level": None,
            "duration": None,
            "cost": "Free",
            "isFree": True,
            "certificateType": "Certification",
            "skills": skills,
        }

    @staticmethod
    def description_for(
        cert_id,
        title,
    ):
        descriptions = {
            "responsive-web-design-v9":
                "Learn HTML, CSS, accessibility, and responsive web design by building projects.",

            "javascript-v9":
                "Learn JavaScript fundamentals, programming concepts, and modern JavaScript development.",

            "front-end-development-libraries-v9":
                "Learn front-end development using popular JavaScript libraries and tools.",

            "python-v9":
                "Learn Python programming fundamentals and build projects to demonstrate your skills.",

            "relational-databases-v9":
                "Learn relational databases, SQL, and database management through practical projects.",

            "back-end-development-and-apis-v9":
                "Learn back-end development, APIs, databases, and server-side programming.",

            "full-stack-developer-v9":
                "Learn full-stack web development through a comprehensive project-based curriculum.",

            "data-analysis-with-python":
                "Learn Python techniques for working with, analysing, and visualising data.",

            "scientific-computing-with-python":
                "Learn Python programming concepts through practical scientific computing projects.",

            "machine-learning-with-python":
                "Learn the fundamentals of machine learning with Python.",
        }

        return descriptions.get(
            cert_id,
            f"Free {title} certification from freeCodeCamp.",
        )

    @staticmethod
    def title_from_id(cert_id):
        return (
            cert_id
            .replace("-v9", "")
            .replace("/", " ")
            .replace("-", " ")
            .replace("_", " ")
            .title()
        )

    @staticmethod
    def category_from_id(cert_id):
        value = cert_id.lower()

        if (
            "python" in value
            or "data-analysis" in value
            or "scientific-computing" in value
            or "machine-learning" in value
            or "college-algebra" in value
        ):
            return "Python"

        if (
            "javascript" in value
            or "algorithm" in value
        ):
            return "JavaScript"

        if (
            "database" in value
            or "relational" in value
        ):
            return "Databases"

        if (
            "front-end" in value
            or "responsive-web" in value
        ):
            return "Web Development"

        if (
            "back-end" in value
            or "api" in value
            or "full-stack" in value
        ):
            return "Web Development"

        if (
            "security" in value
        ):
            return "Cybersecurity"

        if (
            "c-sharp" in value
        ):
            return "C#"

        if (
            "english" in value
            or "spanish" in value
            or "chinese" in value
        ):
            return "Languages"

        return "Development"

    @staticmethod
    def skills_from_id(cert_id):
        value = cert_id.lower()

        skills = []

        if "python" in value:
            skills.append("Python")

        if (
            "javascript" in value
            or "algorithm" in value
        ):
            skills.extend(
                [
                    "JavaScript",
                    "Programming",
                ]
            )

        if (
            "responsive-web" in value
            or "front-end" in value
        ):
            skills.extend(
                [
                    "HTML",
                    "CSS",
                    "Web Development",
                ]
            )

        if (
            "database" in value
            or "relational" in value
        ):
            skills.extend(
                [
                    "SQL",
                    "Databases",
                ]
            )

        if (
            "back-end" in value
            or "api" in value
        ):
            skills.extend(
                [
                    "Backend Development",
                    "APIs",
                ]
            )

        if "full-stack" in value:
            skills.extend(
                [
                    "Full Stack Development",
                    "Web Development",
                ]
            )

        if "machine-learning" in value:
            skills.extend(
                [
                    "Machine Learning",
                    "Python",
                ]
            )

        if "data-analysis" in value:
            skills.extend(
                [
                    "Data Analysis",
                    "Python",
                ]
            )

        if "data-visualization" in value:
            skills.extend(
                [
                    "Data Visualization",
                    "JavaScript",
                ]
            )

        if "scientific-computing" in value:
            skills.extend(
                [
                    "Scientific Computing",
                    "Python",
                ]
            )

        if "c-sharp" in value:
            skills.append("C#")

        if "security" in value:
            skills.append("Cybersecurity")

        if "english" in value:
            skills.append("English")

        if "spanish" in value:
            skills.append("Spanish")

        if "chinese" in value:
            skills.append("Chinese")

        return list(
            dict.fromkeys(skills)
        )