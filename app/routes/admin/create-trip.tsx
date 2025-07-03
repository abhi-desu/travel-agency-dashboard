import { Header } from "../../../components";
import { ComboBoxComponent } from "@syncfusion/ej2-react-dropdowns";
import type { Route } from "./+types/create-trip";
import { comboBoxItems, selectItems } from "~/constants";
import { cn, formatKey } from "~/lib/utils";
import {
  LayerDirective,
  LayersDirective,
  MapsComponent,
} from "@syncfusion/ej2-react-maps";
import React, { useState } from "react";
import { world_map } from "~/constants/world_map";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { account } from "~/appwrite/client";
import { useNavigate } from "react-router";

export const loader = async () => {
  const response = await fetch(
    //usl has been changed to include 'latlng' and 'maps' fields
    "https://restcountries.com/v3.1/all?fields=name,flags,latlng,maps"
  );
  if (!response.ok) {
    throw new Error("Failed to fetch countries");
  }
  const data = await response.json();

  return data.map((country: any) => ({
    name: country.name.common,
    flagUrl: country.flags?.png || "",
    coordinates: country.latlng,
    value: country.name.common,
    openStreetMap: country.maps?.openStreetMaps, // note the 's' at end
  }));
};

const CreateTrip = ({ loaderData }: Route.ComponentProps) => {
  const countries = loaderData as Array<{
    name: string;
    flagUrl: string;
    coordinates: number[];
    value: string;
    openStreetMap?: string;
  }>;
  const navigate = useNavigate();

  const [formData, setFormData] = useState<{
    country: string;
    travelStyle: string;
    interest: string;
    budget: string;
    duration: number;
    groupType: string;
  }>({
    country: countries[0]?.value || "",
    travelStyle: "",
    interest: "",
    budget: "",
    duration: 0,
    groupType: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (
      !formData.country ||
      !formData.travelStyle ||
      !formData.interest ||
      !formData.budget ||
      !formData.groupType
    ) {
      setError("Please provide values for all fields");
      setLoading(false);
      return;
    }

    if (formData.duration < 1 || formData.duration > 10) {
      setError("Duration must be between 1 and 10 days");
      setLoading(false);
      return;
    }

    try {
      const user = await account.get();
      if (!user.$id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/create-trip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: formData.country,
            numberOfDays: formData.duration,
            travelStyle: formData.travelStyle,
            interests: formData.interest,
            budget: formData.budget,
            groupType: formData.groupType,
            userId: user.$id,
          }),
        });
        const result: CreateTripResponse = await response.json();

        if (result?.id) navigate(`/trips/${result.id}`);
        else console.error("Failed to generate a trip");
      } catch (error) {
        console.error("Error logging user and form data:", error);
      } finally {
        setLoading(false);
      }
      const response = await fetch("/api/create-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: formData.country,
          numberOfDays: formData.duration,
          travelStyle: formData.travelStyle,
          interests: formData.interest,
          budget: formData.budget,
          groupType: formData.groupType,
          userId: user.$id,
        }),
      });

      const result = await response.json();

      if (result?.id) navigate(`/trips/${result.id}`);
      else setError("Failed to generate a trip");
    } catch (e) {
      console.error("Error generating trip", e);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof typeof formData, value: string | number) => {
    setFormData({ ...formData, [key]: value });
  };

  const countryData = countries.map((country) => ({
    text: country.name,
    value: country.value,
    flagUrl: country.flagUrl,
  }));

  // Template to show flag image and country name in dropdown
  const countryItemTemplate = (props: any) => {
    if (!props) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img
          src={props.flagUrl}
          alt={`${props.text} flag`}
          style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2 }}
        />
        <span>{props.text}</span>
      </div>
    );
  };

  const mapData = [
    {
      country: formData.country,
      color: "#EA382E",
      coordinates:
        countries.find((c) => c.name === formData.country)?.coordinates || [],
    },
  ];

  return (
    <main className="flex flex-col gap-10 pb-20 wrapper">
      <Header
        title="Add a New Trip"
        description="View and edit AI Generated travel plans"
      />

      <section className="mt-2.5 wrapper-md">
        <form className="trip-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="country">Country</label>
            <ComboBoxComponent
              id="country"
              dataSource={countryData}
              fields={{ text: "text", value: "value" }}
              placeholder="Select a Country"
              className="combo-box"
              value={formData.country}
              itemTemplate={countryItemTemplate}
              change={(e: { value: string | undefined }) => {
                if (e.value) {
                  handleChange("country", e.value);
                }
              }}
              allowFiltering
              filtering={(e) => {
                const query = e.text.toLowerCase();

                e.updateData(
                  countries
                    .filter((country) =>
                      country.name.toLowerCase().includes(query)
                    )
                    .map((country) => ({
                      text: country.name,
                      value: country.value,
                      flagUrl: country.flagUrl,
                    }))
                );
              }}
            />
          </div>

          <div>
            <label htmlFor="duration">Duration</label>
            <input
              id="duration"
              name="duration"
              type="number"
              placeholder="Enter a number of days"
              className="form-input placeholder:text-gray-100"
              value={formData.duration === 0 ? "" : formData.duration}
              onChange={(e) => handleChange("duration", Number(e.target.value))}
            />
          </div>

          {selectItems.map((key) => (
            <div key={key}>
              <label htmlFor={key}>{formatKey(key)}</label>

              <ComboBoxComponent
                id={key}
                dataSource={comboBoxItems[key].map((item) => ({
                  text: item,
                  value: item,
                }))}
                fields={{ text: "text", value: "value" }}
                placeholder={`Select ${formatKey(key)}`}
                change={(e: { value: string | undefined }) => {
                  if (e.value) {
                    handleChange(key, e.value);
                  }
                }}
                allowFiltering
                filtering={(e) => {
                  const query = e.text.toLowerCase();

                  e.updateData(
                    comboBoxItems[key]
                      .filter((item) => item.toLowerCase().includes(query))
                      .map((item) => ({
                        text: item,
                        value: item,
                      }))
                  );
                }}
                className="combo-box"
              />
            </div>
          ))}

          <div>
            <label htmlFor="location">Location on the world map</label>
            <MapsComponent>
              <LayersDirective>
                <LayerDirective
                  shapeData={world_map}
                  dataSource={mapData}
                  shapePropertyPath="name"
                  shapeDataPath="country"
                  shapeSettings={{ colorValuePath: "color", fill: "#E5E5E5" }}
                />
              </LayersDirective>
            </MapsComponent>
          </div>

          <div className="bg-gray-200 h-px w-full" />

          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}

          <footer className="px-6 w-full">
            <ButtonComponent
              type="submit"
              className="button-class !h-12 !w-full"
              disabled={loading}
            >
              <img
                src={`/assets/icons/${
                  loading ? "loader.svg" : "magic-star.svg"
                }`}
                className={cn("size-5", { "animate-spin": loading })}
                alt="button icon"
              />
              <span className="p-16-semibold text-white">
                {loading ? "Generating..." : "Generate Trip"}
              </span>
            </ButtonComponent>
          </footer>
        </form>
      </section>
    </main>
  );
};

export default CreateTrip;
