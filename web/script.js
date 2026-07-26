const amenities = [
  {
    id: 1,
    type: "Restroom",
    building: "Soda Hall",
    floor: 1,
    locationDetails: "",
    hours: "7:00 AM-10:00 PM",
    accessibility: "Accessible",
    rating: 4.4,
    availability: "Available",
    notes: "",
    lastReported: "10 minutes ago",
  },
  {
    id: 2,
    type: "Water refill station",
    building: "Soda Hall",
    floor: 3,
    locationDetails: "",
    hours: "7:00 AM-10:00 PM",
    accessibility: "Accessible",
    rating: 4.7,
    availability: "Available",
    notes: "",
    lastReported: "25 minutes ago",
  },
  {
    id: 3,
    type: "Study space",
    building: "Soda Hall",
    floor: 4,
    locationDetails: "",
    hours: "8:00 AM-9:00 PM",
    accessibility: "Accessible",
    rating: 4.5,
    availability: "Out of service",
    notes: "",
    lastReported: "5 minutes ago",
  },
  {
    id: 4,
    type: "Vending machine",
    building: "Cory Hall",
    floor: 2,
    locationDetails: "",
    hours: "7:30 AM-9:00 PM",
    accessibility: "Accessible",
    rating: 4.0,
    availability: "Available",
    notes: "",
    lastReported: "1 hour ago",
  },
  {
    id: 5,
    type: "Restroom",
    building: "Cory Hall",
    floor: 1,
    locationDetails: "",
    hours: "7:30 AM-9:00 PM",
    accessibility: "Accessible",
    rating: 4.1,
    availability: "Available",
    notes: "",
    lastReported: "20 minutes ago",
  },
  {
    id: 6,
    type: "Study space",
    building: "GSPP",
    floor: 1,
    locationDetails: "",
    hours: "8:00 AM-8:00 PM",
    accessibility: "Accessible",
    rating: 4.6,
    availability: "Available",
    notes: "",
    lastReported: "15 minutes ago",
  },
  {
    id: 7,
    type: "Water refill station",
    building: "GSPP",
    floor: 1,
    locationDetails: "",
    hours: "8:00 AM-8:00 PM",
    accessibility: "Accessible",
    rating: 4.8,
    availability: "Available",
    notes: "",
    lastReported: "30 minutes ago",
  },
  {
    id: 8,
    type: "Food",
    building: "Sutardja Dai Hall",
    floor: 1,
    locationDetails: "",
    hours: "8:00 AM-5:00 PM",
    accessibility: "Accessible",
    rating: 4.2,
    availability: "Available",
    notes: "",
    lastReported: "10 minutes ago",
  },
  {
    id: 9,
    type: "Restroom",
    building: "Sutardja Dai Hall",
    floor: 3,
    locationDetails: "",
    hours: "7:00 AM-9:00 PM",
    accessibility: "Accessible",
    rating: 4.5,
    availability: "Out of service",
    notes: "",
    lastReported: "12 minutes ago",
  },
  {
    id: 10,
    type: "Study space",
    building: "Sutardja Dai Hall",
    floor: 4,
    locationDetails: "",
    hours: "7:00 AM-9:00 PM",
    accessibility: "Accessible",
    rating: 4.4,
    availability: "Available",
    notes: "",
    lastReported: "8 minutes ago",
  },
];

const drawer = document.querySelector("#drawer");
const toggleButton = document.querySelector("[data-drawer-toggle]");
const backButton = document.querySelector("[data-drawer-back]");
const views = document.querySelectorAll("[data-view]");
const searchForm = document.querySelector(".search-form");
const amenityList = document.querySelector(".amenity-list");
const detailView = document.querySelector('[data-view="details"]');
const amenityForm = document.querySelector(".amenity-form");
const formSuccess = document.querySelector(".form-success");

window.initMap = function initMap() {
  new google.maps.Map(document.querySelector("#map"), {
    center: { lat: 37.8719, lng: -122.2585 },
    zoom: 16,
    mapTypeId: "roadmap",
    disableDefaultUI: true,
    clickableIcons: false,
  });
};

const googleMapsScript = document.createElement("script");
const googleMapsApiKey = window.APP_CONFIG?.googleMapsApiKey;

if (googleMapsApiKey) {
  const googleMapsUrl = new URL("https://maps.googleapis.com/maps/api/js");
  googleMapsUrl.searchParams.set("key", googleMapsApiKey);
  googleMapsUrl.searchParams.set("callback", "initMap");
  googleMapsUrl.searchParams.set("loading", "async");
  googleMapsScript.src = googleMapsUrl;
  googleMapsScript.async = true;
  document.head.append(googleMapsScript);
} else {
  const mapElement = document.querySelector("#map");
  mapElement.textContent = "Google Maps is not configured.";
  mapElement.classList.add("map-error");
}

function showView(viewName) {
  views.forEach((view) => {
    view.hidden = view.dataset.view !== viewName;
  });
  backButton.hidden = viewName === "search";

  if (viewName !== "create") formSuccess.hidden = true;

  drawer.dataset.drawerState = "expanded";
  toggleButton.textContent = "Collapse";
  toggleButton.setAttribute("aria-label", "Collapse drawer");
}

function availabilityStatus(availability) {
  return availability.toLowerCase().replaceAll(" ", "-");
}

function showAmenityDetails(item) {
  const amenity = amenities.find(({ id }) => id === Number(item.dataset.amenityId));

  if (!amenity) return;

  const availability = detailView.querySelector(".detail-availability");

  detailView.querySelector(".detail-type").textContent = amenity.type;
  detailView.querySelector(".detail-location").textContent = `${amenity.building} · Floor ${amenity.floor}`;
  availability.textContent = amenity.availability;
  availability.dataset.status = availabilityStatus(amenity.availability);
  detailView.querySelector(".detail-rating").textContent = amenity.rating ? `${amenity.rating}/5` : "Not rated";
  detailView.querySelector(".detail-hours").textContent = amenity.hours || "Not provided";
  detailView.querySelector(".detail-accessibility").textContent = amenity.accessibility;
  detailView.querySelector(".detail-location-details").textContent = amenity.locationDetails || "Not provided";
  detailView.querySelector(".detail-notes").textContent = amenity.notes || "Not provided";
  detailView.querySelector(".detail-update").textContent = `Last reported ${amenity.lastReported}`;
  showView("details");
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  amenityList.querySelectorAll(".amenity-item, .amenity-placeholder").forEach((item) => item.remove());
  amenityList.insertAdjacentHTML("beforeend", amenities
    .map(
      (amenity) => `
        <div class="amenity-item" data-amenity-id="${amenity.id}" role="button" tabindex="0">
          <div class="amenity-item-header">
            <p class="amenity-type">${amenity.type}</p>
            <span class="availability-badge" data-status="${availabilityStatus(amenity.availability)}">${amenity.availability}</span>
          </div>
          <p>Building: ${amenity.building}</p>
          <p>Floor: ${amenity.floor}</p>
          <p>Rating: ${amenity.rating}/5</p>
        </div>
      `,
    )
    .join(""));
});

amenityForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(amenityForm);
  formSuccess.textContent = `${formData.get("type")} at ${formData.get("building")} was submitted for review.`;
  formSuccess.hidden = false;
  amenityForm.reset();
  formSuccess.focus();
});

amenityForm.addEventListener("input", () => {
  formSuccess.hidden = true;
});

amenityList.addEventListener("click", (event) => {
  const item = event.target.closest(".amenity-item");
  if (item) showAmenityDetails(item);
});

amenityList.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const item = event.target.closest(".amenity-item");
  if (!item) return;

  event.preventDefault();
  showAmenityDetails(item);
});

document.querySelectorAll("[data-drawer-view]").forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.drawerView);
  });
});

toggleButton.addEventListener("click", () => {
  const isCollapsed = drawer.dataset.drawerState === "collapsed";

  drawer.dataset.drawerState = isCollapsed ? "expanded" : "collapsed";
  toggleButton.textContent = isCollapsed ? "Collapse" : "Expand";
  toggleButton.setAttribute("aria-label", `${isCollapsed ? "Collapse" : "Expand"} drawer`);
});
