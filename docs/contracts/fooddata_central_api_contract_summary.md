# FoodData Central API — Contract Summary

## Overview
The USDA FoodData Central API is an OpenAPI 3.0 REST API for searching foods and retrieving nutrient data. It is served from:

`https://api.nal.usda.gov/fdc`

Authentication uses an API key passed as a query parameter:

`api_key=YOUR_KEY`

The spec defines one main tag (`FDC`) and a small set of read-only endpoints for food lookup, batch retrieval, food listing, search, and downloading the API spec itself.

---

## Global Contract Notes

### Base URL
- `https://api.nal.usda.gov/fdc`

### Security
- API key auth in query string
- Parameter name: `api_key`

### Response families
Depending on endpoint and requested format, food payloads can be one of these models:
- `AbridgedFoodItem`
- `BrandedFoodItem`
- `FoundationFoodItem`
- `SRLegacyFoodItem`
- `SurveyFoodItem`
- `SearchResult` (search wrapper/result shape)

### Common patterns
- Supports both `GET` and `POST` for several endpoints.
- `GET` is mainly for simple query-string use.
- `POST` is mainly for more structured criteria objects.
- Pagination uses `pageSize` and `pageNumber`.
- Sorting commonly uses `sortBy` and `sortOrder`.
- Some endpoints allow filtering to specific nutrients with a list of nutrient numbers.

---

## Endpoint Contracts

## 1) GET `/v1/food/{fdcId}`
### Purpose
Fetch details for one food item by FDC ID.

### Inputs
#### Path params
- `fdcId` (required, string in spec): the FDC identifier of the food.

#### Query params
- `format` (optional):
  - `abridged`
  - `full` (default)
- `nutrients` (optional): up to 25 nutrient numbers.
  - Can be sent as comma-separated values or repeated query params.
  - Example: `nutrients=203,204`

### Response
#### 200
Returns one food object. Shape can be one of:
- `AbridgedFoodItem`
- `BrandedFoodItem`
- `FoundationFoodItem`
- `SRLegacyFoodItem`
- `SurveyFoodItem`

#### Errors
- `400` bad input parameter
- `404` no results found

### When to use
Use this when you already know the exact FDC ID and want one item’s nutrient detail.

---

## 2) GET `/v1/foods`
### Purpose
Fetch details for multiple foods using a list of FDC IDs.

### Inputs
#### Query params
- `fdcIds` (required): list of 1 to 20 FDC IDs
- `format` (optional): `abridged` or `full`
- `nutrients` (optional): up to 25 nutrient numbers

### Response
#### 200
Returns an array of food objects. Each element may be any of the main food item models.

Important behavior:
- Invalid or missing IDs are omitted.
- If nothing matches, the result is an empty array.

#### Errors
- `400` bad input parameter

### When to use
Use this for small batch hydration of foods by known IDs.

---

## 3) POST `/v1/foods`
### Purpose
Same business purpose as `GET /v1/foods`, but with a request body instead of query parameters.

### Request body
- `FoodsCriteria`

This criteria object is used to send:
- one or more FDC IDs
- optional `format`
- optional `nutrients`

### Response
#### 200
Array of matching food detail objects.

Behavior is the same as the GET version:
- invalid IDs are omitted
- no matches returns an empty array

#### Errors
- `400` bad input parameter

### When to use
Prefer this over GET when your client handles structured JSON more cleanly or when building reusable backend integrations.

---

## 4) GET `/v1/foods/list`
### Purpose
Return a paged list of foods in abridged format.

### Inputs
#### Query params
- `dataType` (optional): one or more of
  - `Branded`
  - `Foundation`
  - `Survey (FNDDS)`
  - `SR Legacy`
- `pageSize` (optional): integer, 1–200, default 50
- `pageNumber` (optional): page index
- `sortBy` (optional):
  - `dataType.keyword`
  - `lowercaseDescription.keyword`
  - `fdcId`
  - `publishedDate`
- `sortOrder` (optional):
  - `asc`
  - `desc`

### Response
#### 200
Array of `AbridgedFoodItem`.

#### Errors
- `400` bad input parameter

### When to use
Use this for browsing large datasets page by page when you do not need full food detail.

---

## 5) POST `/v1/foods/list`
### Purpose
Same as `GET /v1/foods/list`, but criteria are supplied in JSON.

### Request body
- `FoodListCriteria`

Typically includes:
- `dataType`
- `pageSize`
- `pageNumber`
- `sortBy`
- `sortOrder`

### Response
#### 200
Array of `AbridgedFoodItem`.

#### Errors
- `400` bad input parameter

### When to use
Useful when your application prefers JSON request bodies instead of query-string construction.

---

## 6) GET `/v1/foods/search`
### Purpose
Search foods by keyword.

### Inputs
#### Query params
- `query` (required): one or more search terms
- `dataType` (optional): one or more of
  - `Branded`
  - `Foundation`
  - `Survey (FNDDS)`
  - `SR Legacy`
- `pageSize` (optional): integer, 1–200, default 50
- `pageNumber` (optional)
- `sortBy` (optional):
  - `dataType.keyword`
  - `lowercaseDescription.keyword`
  - `fdcId`
  - `publishedDate`
- `sortOrder` (optional): `asc` or `desc`
- `brandOwner` (optional): only applies to Branded foods

The `query` string may include search operators.

### Response
#### 200
Array of `SearchResult`.

#### Errors
- `400` bad input parameter

### When to use
This is the main entry point for text search such as “cheddar cheese” or a brand/product name.

---

## 7) POST `/v1/foods/search`
### Purpose
Same as GET search, but with JSON criteria.

### Request body
- `FoodSearchCriteria`

Typically includes:
- `query`
- `dataType`
- `pageSize`
- `pageNumber`
- `sortBy`
- `sortOrder`
- `brandOwner`

### Response
#### 200
Array of `SearchResult`.

#### Errors
- `400` bad input parameter

### When to use
Best choice for app backends and clients that want structured search requests.

---

## 8) GET `/v1/json-spec`
### Purpose
Return the OpenAPI specification in JSON format.

### Response
- Default response: JSON rendering of the OpenAPI 3.0 spec

### When to use
Useful for code generation, validation, internal tooling, or keeping your SDK in sync with the official contract.

---

## 9) GET `/v1/yaml-spec`
### Purpose
Return the OpenAPI specification in YAML format.

### Response
- Default response: YAML rendering of the OpenAPI 3.0 spec

### When to use
Useful for human-readable API review, source control, and OpenAPI tooling that prefers YAML.

---

## Core Schema Contracts

## AbridgedFoodItem
A compact food representation used in list-style endpoints.

### Required fields
- `fdcId`
- `dataType`
- `description`

### Notable fields
- `foodNutrients` (abridged nutrient array)
- `publicationDate`
- `brandOwner` (Branded only)
- `gtinUpc` (Branded only)
- `ndbNumber` (Foundation / SR Legacy)
- `foodCode` (Survey foods)

### Best use
Use when rendering lightweight result lists.

---

## BrandedFoodItem
Represents packaged/commercial foods.

### Typical fields
- `fdcId`
- `availableDate`
- `brandOwner`
- `dataSource`
- `dataType`
- `description`
- `foodClass`
- `gtinUpc`
- `householdServingFullText`
- `ingredients`
- `modifiedDate`
- `publicationDate`
- `servingSize`
- `servingSizeUnit`
- `brandedFoodCategory`
- `foodNutrients`
- `foodUpdateLog`
- `labelNutrients`

### Important contract detail
`labelNutrients` groups label-style values such as:
- calories
- fat
- saturatedFat
- transFat
- cholesterol
- sodium
- carbohydrates
- fiber
- sugars
- protein
- calcium
- iron
- potassium

### Best use
Great for barcode/product search and nutrition-label style UI.

---

## FoundationFoodItem
Represents foundational USDA foods with richer analytical detail.

### Typical fields
The spec excerpt shows at least:
- `fdcId`
- `dataType`
- `description`
- `foodClass`
- `footNote`

In practice this model is intended for more detailed, research-oriented food composition records than the abridged model.

### Best use
Use when you need more authoritative/raw nutrient composition rather than consumer-facing label data.

---

## SRLegacyFoodItem
Represents food entries from the legacy Standard Reference dataset.

### Best use
Useful for compatibility with older USDA references and broad generic food coverage.

---

## SurveyFoodItem
Represents foods from FNDDS survey data.

### Best use
Helpful when working with dietary survey classifications and food codes.

---

## SearchResult
Represents the result shape returned by food search endpoints.

### Contract role
This is a search-focused wrapper/model rather than the raw full food detail model.
It is intended for search result pages and may differ from the detailed food objects returned by `/food/{fdcId}` and `/foods`.

---

## Criteria Object Contracts

## FoodsCriteria
Used by `POST /v1/foods`.

### Role
Structured batch lookup criteria for:
- `fdcIds`
- optional `format`
- optional `nutrients`

---

## FoodListCriteria
Used by `POST /v1/foods/list`.

### Role
Structured paging/filtering criteria for list retrieval.

Likely includes:
- `dataType`
- `pageSize`
- `pageNumber`
- `sortBy`
- `sortOrder`

---

## FoodSearchCriteria
Used by `POST /v1/foods/search`.

### Role
Structured search criteria.

Likely includes:
- `query`
- `dataType`
- `pageSize`
- `pageNumber`
- `sortBy`
- `sortOrder`
- `brandOwner`

---

## Sorting and Filtering Contract Summary

### Data type filter values
- `Branded`
- `Foundation`
- `Survey (FNDDS)`
- `SR Legacy`

### Sortable fields shown in spec
- `dataType.keyword`
- `lowercaseDescription.keyword`
- `fdcId`
- `publishedDate`

### Sort order
- `asc`
- `desc`

### Pagination
- `pageSize`: 1–200 on list/search endpoints
- `pageNumber`: page offset index

---

## Error Contract Summary
The spec exposes minimal explicit error contracts:
- `400` bad input parameter
- `404` no results found (shown for single-food lookup)

Most endpoints do not define rich typed error payloads in the excerpted spec, so consumers should not assume a detailed structured error object unless verified during integration.

---

## Practical Reading of the API Design

### Best endpoint by use case
- Exact food by ID: `GET /v1/food/{fdcId}`
- Batch hydrate known IDs: `GET/POST /v1/foods`
- Infinite scroll or browse lists: `GET/POST /v1/foods/list`
- User text search: `GET/POST /v1/foods/search`
- Generate clients or inspect contract: `GET /v1/json-spec` or `GET /v1/yaml-spec`

### GET vs POST rule of thumb
- Use `GET` for quick tests and simple calls
- Use `POST` for production integrations where criteria are easier to manage as JSON

### Most important modeling distinction
The API separates:
1. **search/list results** for discovery
2. **food detail objects** for full nutrient inspection
3. **dataset-specific food schemas** (`Branded`, `Foundation`, `Survey`, `SR Legacy`)

That means a client should usually:
1. search or list
2. capture FDC IDs
3. hydrate full food details only when needed

---

## Short Executive Summary
FoodData Central exposes a small, clean, read-only contract surface:
- 1 single-item detail endpoint
- 1 multi-item detail endpoint
- 1 list endpoint
- 1 search endpoint
- 2 machine-readable spec endpoints

Most of the API complexity is not in the number of endpoints, but in the data models returned for different food datasets. The most important implementation concerns are:
- API-key handling
- dataset-specific model differences
- pagination and sorting
- deciding when to use abridged vs full responses
- mapping search results to full food detail calls

If you want, I can turn this into a cleaner developer-facing version next: either a **table format**, a **Markdown README**, or a **frontend integration guide with example requests/responses**.

