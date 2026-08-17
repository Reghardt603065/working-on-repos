"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Award,
  ExternalLink,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type Certification = {
  id: string;
  name: string;
  issuer: string;
  status: string;
  progress: number;
  issueDate: string | null;
  expiryDate: string | null;
  credentialUrl: string | null;
  skills: string[];
};

type CertificationListing = {
  id: string;
  title: string;
  provider: string;
  description: string | null;
  url: string;
  source: string;
  externalId: string;
  category: string | null;
  level: string | null;
  duration: string | null;
  cost: string | null;
  isFree: boolean;
  certificateType: string | null;
  skills: string[];
  lastVerified: string;
  createdAt: string;
  updatedAt: string;
};

export function CertificationManager({
  initial,
}: {
  initial: Certification[];
}) {
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState("");

  const [listings, setListings] = useState<CertificationListing[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [provider, setProvider] = useState("");
  const [skill, setSkill] = useState("");
  const [freeOnly, setFreeOnly] = useState(true);

  const [loadingListings, setLoadingListings] = useState(true);
  const [listingError, setListingError] = useState("");

  const average = useMemo(
    () =>
      items.length
        ? Math.round(
            items.reduce(
              (sum, item) => sum + item.progress,
              0
            ) / items.length
          )
        : 0,
    [items]
  );

  useEffect(() => {
    async function loadListings() {
      try {
        setLoadingListings(true);
        setListingError("");

        const response = await fetch(
          "/api/certification-listings"
        );

        if (!response.ok) {
          throw new Error(
            "Could not load certification listings"
          );
        }

        const data = await response.json();

        setListings(
          Array.isArray(data.items)
            ? data.items
            : []
        );
      } catch (error) {
        console.error(error);
        setListingError(
          "Could not load certification listings."
        );
      } finally {
        setLoadingListings(false);
      }
    }

    loadListings();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        listings
          .map((listing) => listing.category)
          .filter(
            (value): value is string =>
              Boolean(value)
          )
      )
    ).sort();
  }, [listings]);

  const providers = useMemo(() => {
    return Array.from(
      new Set(
        listings
          .map((listing) => listing.provider)
          .filter(
            (value): value is string =>
              Boolean(value)
          )
      )
    ).sort();
  }, [listings]);

  const skills = useMemo(() => {
    return Array.from(
      new Set(
        listings.flatMap((listing) =>
          listing.skills.filter(Boolean)
        )
      )
    ).sort();
  }, [listings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      if (freeOnly && !listing.isFree) {
        return false;
      }

      if (
        category &&
        listing.category !== category
      ) {
        return false;
      }

      if (
        provider &&
        listing.provider !== provider
      ) {
        return false;
      }

      if (
        skill &&
        !listing.skills.includes(skill)
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        listing.title,
        listing.provider,
        listing.description,
        listing.category,
        listing.level,
        listing.certificateType,
        ...listing.skills,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    listings,
    search,
    category,
    provider,
    skill,
    freeOnly,
  ]);

  async function add(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");

    const form = new FormData(e.currentTarget);

    const payload = {
      name: form.get("name"),
      issuer: form.get("issuer"),
      status: form.get("status"),
      progress: Number(
        form.get("progress") || 0
      ),
      issueDate: null,
      expiryDate:
        form.get("expiryDate") || null,
      credentialUrl: "",
      skills: String(
        form.get("skills") || ""
      )
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };

    const response = await fetch(
      "/api/certifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const body = await response.json();

    if (!response.ok) {
      setMessage(
        body.error ||
          "Could not add certification"
      );
      return;
    }

    setItems((current) => [
      {
        ...body.data,
        issueDate: body.data.issueDate,
        expiryDate: body.data.expiryDate,
      },
      ...current,
    ]);

    e.currentTarget.reset();
    setMessage("Certification added.");
  }

  async function addFromListing(
    listing: CertificationListing
  ) {
    setMessage("");

    const alreadyAdded = items.some(
      (item) =>
        item.name.toLowerCase() ===
          listing.title.toLowerCase() &&
        item.issuer.toLowerCase() ===
          listing.provider.toLowerCase()
    );

    if (alreadyAdded) {
      setMessage(
        "This certification is already in My Certifications."
      );
      return;
    }

    const response = await fetch(
      "/api/certifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: listing.title,
          issuer: listing.provider,
          status: "PLANNED",
          progress: 0,
          issueDate: null,
          expiryDate: null,
          credentialUrl: listing.url,
          skills: listing.skills,
        }),
      }
    );

    const body = await response.json();

    if (!response.ok) {
      setMessage(
        body.error ||
          "Could not add certification."
      );
      return;
    }

    setItems((current) => [
      {
        ...body.data,
        issueDate: body.data.issueDate,
        expiryDate: body.data.expiryDate,
      },
      ...current,
    ]);

    setMessage(
      `"${listing.title}" added to My Certifications.`
    );
  }

  async function update(
    id: string,
    status: string,
    progress: number
  ) {
    const response = await fetch(
      `/api/certifications/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          progress,
        }),
      }
    );

    if (response.ok) {
      const body = await response.json();

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...body.data,
              }
            : item
        )
      );
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Delete this certification?"
      )
    ) {
      return;
    }

    const response = await fetch(
      `/api/certifications/${id}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      setItems((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );
    }
  }

  return (
    <>
      <section
        className="card"
        style={{ marginBottom: 18 }}
      >
        <div className="list-item">
          <div>
            <h2 style={{ marginBottom: 5 }}>
              Overall certification progress
            </h2>

            <span className="muted">
              Average across your continuous
              skills ledger
            </span>
          </div>

          <span className="stat-value">
            {average}%
          </span>
        </div>

        <div className="progress">
          <span
            style={{
              width: `${average}%`,
            }}
          />
        </div>
      </section>

      <section>
        <div style={{ marginBottom: 14 }}>
          <h2>My Certifications</h2>

          <p className="muted">
            Certifications you are tracking
            personally.
          </p>
        </div>

        <div className="grid grid-3">
          <form
            className="card form-stack"
            onSubmit={add}
          >
            <h2>
              <Plus size={19} />
              Add certification
            </h2>

            {message && (
              <div
                className={`form-message ${
                  message.includes("added")
                    ? "success"
                    : "error"
                }`}
              >
                {message}
              </div>
            )}

            <div className="field">
              <label>Name</label>

              <input
                className="input"
                name="name"
                required
              />
            </div>

            <div className="field">
              <label>Issuer</label>

              <input
                className="input"
                name="issuer"
                required
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Status</label>

                <select
                  className="select"
                  name="status"
                  defaultValue="IN_PROGRESS"
                >
                  <option value="PLANNED">
                    Planned
                  </option>

                  <option value="IN_PROGRESS">
                    In progress
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>
                </select>
              </div>

              <div className="field">
                <label>
                  Progress %
                </label>

                <input
                  className="input"
                  name="progress"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="0"
                />
              </div>
            </div>

            <div className="field">
              <label>Skills</label>

              <input
                className="input"
                name="skills"
                placeholder="React, JavaScript"
              />
            </div>

            <div className="field">
              <label>
                Expiry date (optional)
              </label>

              <input
                className="input"
                name="expiryDate"
                type="date"
              />
            </div>

            <button className="btn btn-primary">
              Add certification
            </button>
          </form>

          <div
            className="grid"
            style={{
              gridColumn: "span 2",
            }}
          >
            {items.length ? (
              items.map((item) => (
                <article
                  className="card"
                  key={item.id}
                >
                  <div className="list-item">
                    <div>
                      <span className="icon-box">
                        <Award size={20} />
                      </span>

                      <h3
                        style={{
                          margin:
                            "12px 0 3px",
                        }}
                      >
                        {item.name}
                      </h3>

                      <span className="muted">
                        {item.issuer}
                      </span>
                    </div>

                    <div className="job-actions">
                      <select
                        className="select"
                        value={item.status}
                        onChange={(event) =>
                          update(
                            item.id,
                            event.target.value,
                            event.target.value ===
                              "COMPLETED"
                              ? 100
                              : item.progress
                          )
                        }
                      >
                        <option value="PLANNED">
                          Planned
                        </option>

                        <option value="IN_PROGRESS">
                          In progress
                        </option>

                        <option value="COMPLETED">
                          Completed
                        </option>

                        <option value="EXPIRED">
                          Expired
                        </option>
                      </select>

                      <button
                        className="btn btn-danger btn-small"
                        onClick={() =>
                          remove(item.id)
                        }
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="tags">
                    {item.skills.map(
                      (skill) => (
                        <span
                          className="badge"
                          key={skill}
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginTop: 14,
                    }}
                  >
                    <div
                      className="progress"
                      style={{ flex: 1 }}
                    >
                      <span
                        style={{
                          width: `${item.progress}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {item.progress}%
                    </strong>
                  </div>

                  <input
                    aria-label="Certification progress"
                    type="range"
                    min="0"
                    max="100"
                    value={item.progress}
                    disabled={
                      item.status ===
                      "COMPLETED"
                    }
                    onChange={(event) =>
                      setItems(
                        (current) =>
                          current.map(
                            (cert) =>
                              cert.id ===
                              item.id
                                ? {
                                    ...cert,
                                    progress:
                                      Number(
                                        event
                                          .target
                                          .value
                                      ),
                                  }
                                : cert
                          )
                      )
                    }
                    onMouseUp={(event) =>
                      update(
                        item.id,
                        item.status,
                        Number(
                          (
                            event.target as HTMLInputElement
                          ).value
                        )
                      )
                    }
                  />
                </article>
              ))
            ) : (
              <div className="card empty">
                No certifications yet. Add
                the first learning target.
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 14 }}>
          <h2>
            Browse Free Certifications
          </h2>

          <p className="muted">
            Discover free certifications
            collected from our certification
            sources.
          </p>
        </div>

        <div
          className="card"
          style={{ marginBottom: 18 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 2fr) repeat(3, minmax(150px, 1fr)) auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div className="field">
              <label htmlFor="certification-search">
                Search
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <Search
                  size={17}
                  style={{
                    position:
                      "absolute",
                    left: 10,
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                  }}
                />

                <input
                  id="certification-search"
                  className="input"
                  style={{
                    paddingLeft: 34,
                  }}
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search certifications, skills..."
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="certification-category">
                Category
              </label>

              <select
                id="certification-category"
                className="select"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All categories
                </option>

                {categories.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="certification-provider">
                Provider
              </label>

              <select
                id="certification-provider"
                className="select"
                value={provider}
                onChange={(event) =>
                  setProvider(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All providers
                </option>

                {providers.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="certification-skill">
                Skill
              </label>

              <select
                id="certification-skill"
                className="select"
                value={skill}
                onChange={(event) =>
                  setSkill(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All skills
                </option>

                {skills.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  )
                )}
              </select>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingBottom: 10,
              }}
            >
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(event) =>
                  setFreeOnly(
                    event.target.checked
                  )
                }
              />

              Free only
            </label>
          </div>
        </div>

        {loadingListings && (
          <div className="card empty">
            Loading certifications...
          </div>
        )}

        {listingError && (
          <div className="card">
            <div className="form-message error">
              {listingError}
            </div>
          </div>
        )}

        {!loadingListings &&
          !listingError &&
          filteredListings.length === 0 && (
            <div className="card empty">
              No certifications match your
              search.
            </div>
          )}

        {!loadingListings &&
          !listingError &&
          filteredListings.length > 0 && (
            <div className="grid grid-3">
              {filteredListings.map(
                (listing) => {
                  const alreadyAdded =
                    items.some(
                      (item) =>
                        item.name
                          .toLowerCase() ===
                          listing.title.toLowerCase() &&
                        item.issuer
                          .toLowerCase() ===
                          listing.provider.toLowerCase()
                    );

                  return (
                    <article
                      className="card"
                      key={listing.id}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: 12,
                          alignItems:
                            "flex-start",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              marginBottom: 6,
                              fontSize: 19,
                              fontWeight: 700,
                              lineHeight: 1.3,
                            }}
                          >
                            {listing.title}
                          </h3>

                          <span className="muted">
                            {listing.provider}
                          </span>
                        </div>

                        {listing.isFree && (
                          <span className="badge">
                            Free
                          </span>
                        )}
                      </div>

                      {listing.description && (
                        <p
                          className="muted"
                          style={{
                            marginTop: 12,
                          }}
                        >
                          {
                            listing.description
                          }
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 12,
                        }}
                      >
                        {listing.category && (
                          <span className="badge">
                            {listing.category}
                          </span>
                        )}

                        {listing.level && (
                          <span className="badge">
                            {listing.level}
                          </span>
                        )}

                        {listing.duration && (
                          <span className="badge">
                            {listing.duration}
                          </span>
                        )}
                      </div>

                      {listing.skills
                        .length > 0 && (
                        <div
                          className="tags"
                          style={{
                            marginTop: 12,
                          }}
                        >
                          {listing.skills.map(
                            (skill) => (
                              <span
                                className="badge"
                                key={skill}
                              >
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          marginTop: 18,
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span className="muted">
                          {listing.certificateType ||
                            "Certification"}
                        </span>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            justifyContent:
                              "flex-end",
                          }}
                        >
                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              addFromListing(
                                listing
                              )
                            }
                            disabled={
                              alreadyAdded
                            }
                          >
                            <Plus size={16} />

                            {alreadyAdded
                              ? "Already Added"
                              : "Add to My Certifications"}
                          </button>

                          <a
                            className="btn"
                            href={
                              listing.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View certification
                            <ExternalLink
                              size={16}
                            />
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
      </section>
    </>
  );
}