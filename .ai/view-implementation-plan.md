# API Endpoint Implementation Plan: GET /families/{familyId}/progress

## 1. Przegląd punktu końcowego
- Zapewnia dzienny widok postępów rutyn rodziny dla dashboardu rodzica.
- Łączy dane z `routines`, `routine_sessions`, `routine_tasks` i `task_completions`, zachowując kontekst dziecka.
- Obsługuje filtr daty (domyślnie dziś) oraz opcjonalne dołączenie podsumowania poprzedniego dnia.
- W odpowiedzi zwraca dane zgodne z `FamilyProgressSummaryDto`, gotowe do renderowania UI.

## 2. Szczegóły żądania
- Metoda HTTP: `GET`.
- Struktura URL: `/api/v1/families/{familyId}/progress` (`src/app/api/v1/families/[familyId]/progress/route.ts`).
- Parametry ścieżki: `familyId` (UUID, wymagane; musi odpowiadać rodzinie powiązanej z tokenem).
- Parametry zapytania: `date` (`YYYY-MM-DD`, opcjonalny; maks. dziś, co najwyżej 30 dni wstecz), `includeHistory` (`boolean`, opcjonalny; domyślnie `false`).
- Nagłówki: `Authorization: Bearer <Supabase JWT>`; opcjonalnie `If-None-Match` dla obsługi ETag.

## 3. Szczegóły odpowiedzi
- Status sukcesu: `200 OK` (zwraca pustą strukturę przy braku danych; `date` odzwierciedla żądaną wartość).
- DTO: `FamilyProgressSummaryDto` (w tym `FamilyProgressRoutineSummaryDto`, `FamilyProgressChildSummaryDto`, `FamilyProgressTaskSummaryDto`).
- Rozszerzenie dla historii: `history?: { previousDay?: FamilyProgressSummaryDto }` zwracane gdy `includeHistory=true` i dane istnieją.
- Pola nullowalne: `sessionId`, `durationSeconds`, `tasks` (jeśli brak zadań → `[]`).
- Kształt odpowiedzi:
  ```json
  {
    "date": "2024-04-01",
    "routines": [...],
    "history": {
      "previousDay": { "date": "2024-03-31", "routines": [...] }
    }
  }
  ```

## 4. Przepływ danych
- Handler Next.js pobiera Supabase client poprzez helper uwierzytelniający, waliduje parametry i claims JWT.
- Serwis `familyProgressService.getDailySummary` wywołuje zapytanie (widok SQL lub RPC) filtrujące po `family_id`, `session_date`.
- Serwis mapuje rekordy do struktur DTO, dokleja dane historyczne poprzez drugie wywołanie przy `includeHistory`.
- Handler formatuje odpowiedź, ustawia nagłówki (`Cache-Control`, `ETag`/`Last-Modified`) i zwraca wynik.

## 5. Względy bezpieczeństwa
- Wymuś uwierzytelnienie Supabase JWT oraz sprawdzanie `role` ∈ {`parent`, `admin`} dla dostępu.
- Zweryfikuj zgodność `familyId` z `profiles.family_id` pobranym z tokena lub profilu bazodanowego.
- Korzystaj z RLS poprzez standardowego klienta Supabase; zapytania nie mogą używać service role.
- Dodaj middleware limitujący liczbę żądań, aby chronić agregację przed nadużyciami.

## 6. Obsługa błędów
- `400 Bad Request`: niepoprawny UUID, błędny format daty, data poza dozwolonym zakresem, nieprawidłowa wartość `includeHistory`.
- `401 Unauthorized`: brak nagłówka `Authorization` lub nieprawidłowy token.
- `403 Forbidden`: token nie odpowiada rodzinie lub rola użytkownika nie ma uprawnień.
- `404 Not Found`: opcjonalnie przy braku rodziny; preferowane `200` z pustymi danymi — potwierdzić z produktem.
- `500 Internal Server Error`: błędy Supabase/RPC; logować szczegóły oraz zwracać generyczny komunikat.

## 7. Wydajność
- Utwórz zoptymalizowany widok SQL lub RPC łączący wymagane tabele z filtrami po indeksowanych kolumnach (`family_id`, `session_date`).
- Zastosuj ETag (`hash` danych) i `Cache-Control: private, max-age=30` dla krótkotrwałego cache po stronie klienta.
- Wymuś limit czasu i paginację przy pobieraniu historii (re-użyj `family_points_snapshots` dla metryk).
- Re-używaj wyników w pamięci (np. `edge-cache`) w ramach tego samego żądania przy pobieraniu danych historycznych.

## 8. Kroki implementacji
1. Zdefiniuj/rozszerz typy w `src/types.ts` (np. `FamilyProgressSummaryWithHistoryDto`, zapytanie wejściowe).
2. Przygotuj widok SQL lub funkcję RPC (`family_daily_progress`) agregującą dane i uwzględniającą soft delete.
3. Dodaj moduł `src/app/api/_services/familyProgressService.ts` z metodami `getDailySummary` oraz `getPreviousDaySummary`.
4. Zaimplementuj validatory (np. `zod`) dla `familyId`, `date`, `includeHistory` oraz helper ustalający domyślne wartości.
5. Utwórz handler `route.ts`, pobierz autoryzowanego użytkownika, sprawdź przynależność do rodziny, wywołaj serwis i mapuj wynik.
6. Dodaj obsługę nagłówków `ETag`, `Cache-Control`, konwersję do struktur DTO i fallback do pustych tablic.
7. Zapisuj błędy do loggera (Sentry/console) i zwracaj ustandaryzowane odpowiedzi `error.code` / `error.message`.
8. Uaktualnij dokumentację OpenAPI/Swagger i scenariusze testowe (manualne + przyszłe automatyczne) dla różnych wariantów parametrów.
