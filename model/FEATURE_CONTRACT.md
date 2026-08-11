# Hotel Cancellation Model Feature Contract

## Runtime artifacts

The server-side model consists of `hotel_booking_model.pkl`, `scaler.pkl`, and `columns.pkl`. The model was serialized with **scikit-learn 1.6.1**. The inference runtime requires the compatible `pandas`, `numpy`, `joblib`, and scikit-learn versions pinned in `model/requirements.txt`.

## Required booking fields

| Interface field | Model field | Accepted values or bounds |
|---|---|---|
| Hotel | `hotel` | `City Hotel`, `Resort Hotel` |
| Lead time | `lead_time` | Integer, 0–730 days |
| Arrival date | `arrival_date_year`, `arrival_date_month`, `arrival_date_week_number`, `arrival_date_day_of_month` | Years 2015–2017; full English month; week 1–53; day 1–31 |
| Stay length | `stays_in_weekend_nights`, `stays_in_week_nights` | Integers, 0–60 nights each |
| Guests | `adults`, `children`, `babies` | Adults 1–20; children 0–20; babies 0–10 |
| Meal plan | `meal` | `BB`, `HB`, `FB`, `SC`, `Undefined` |
| Booking source | `country`, `market_segment`, `distribution_channel` | Three-letter country code and model-supported category values |
| Guest history | `is_repeated_guest`, `previous_cancellations`, `previous_bookings_not_canceled` | Boolean plus non-negative counts |
| Room details | `reserved_room_type`, `assigned_room_type` | Reserved A–L; assigned A–P |
| Payment and changes | `booking_changes`, `deposit_type`, `customer_type`, `adr` | Non-negative changes/rate and model-supported category values |
| Arrival preferences | `required_car_parking_spaces`, `total_of_special_requests`, `days_in_waiting_list` | Parking 0–5; requests 0–5; wait-list days 0–1,000 |

## Preprocessing and response

The Python bridge converts one submitted booking to a dataframe, applies one-hot encoding with `pandas.get_dummies`, reindexes it against `columns.pkl` with zero-fill for absent categories, then applies `scaler.pkl` before calling `predict_proba`. The probability attached to model class `1` is the cancellation probability. The application renders the result as **Low** below 35%, **Medium** from 35% to below 65%, and **High** at 65% or higher.
