# Dokument wymagań produktu (PRD) - Dziennik Rutyn Eryka
## 1. Przegląd produktu
"Dziennik Rutyn Eryka" to webowa aplikacja w podejściu "Mobile First" zaprojektowana w celu motywowania 11-letniego Eryka do regularnego wykonywania codziennych obowiązków. Aplikacja przekształca obowiązki w angażującą grę poprzez system trzech rutyn (porannej, popołudniowej, wieczornej), w ramach których Eryk wykonuje zadania z interaktywnej listy. Aplikacja przez cały czas wyświetla pełną listę zadań danej rutyny, wyraźnie podświetlając aktualne zadanie do wykonania, aby zapewnić skupienie przy jednoczesnym zachowaniu wglądu w cały proces.

Główne funkcje obejmują system punktacji, timer motywujący do szybkiego wykonywania zadań poprzez przyznawanie podwójnych punktów za pobicie rekordu oraz system osiągnięć. Aplikacja dostarcza również prosty w obsłudze panel administracyjny dla rodzica, który pozwala na zarządzanie zadaniami, nagrodami i śledzenie postępów dziecka.

Celem produktu jest zwiększenie samodzielności i terminowości Eryka, przy jednoczesnym odciążeniu rodzica od konieczności ciągłego nadzoru i przypominania. Architektura systemu jest przygotowana na przyszłą rozbudowę o obsługę wielu dzieci i rodziców.

## 2. Problem użytkownika
Produkt adresuje problemy dwóch kluczowych użytkowników:

1.  Dziecko (Eryk, 11 lat):
    * Brak motywacji: Codzienne obowiązki są postrzegane jako nużące i pozbawione natychmiastowej gratyfikacji.
    * Nieskuteczny system: Obecna, papierowa lista zadań jest nieefektywna, łatwo ją zgubić i nie angażuje uwagi. Statyczna lista nie pokazuje postępu w czasie rzeczywistym.
    * Brak poczucia postępu: Trudno jest śledzić swoje postępy w dłuższej perspektywie i widzieć namacalne korzyści z wykonywanych obowiązków.

2.  Rodzic:
    * Obciążenie psychiczne i czasowe: Konieczność ciągłego przypominania, nadzorowania i sprawdzania wykonania zadań jest frustrująca i czasochłonna.
    * Brak narzędzia do motywacji: Brak zautomatyzowanego i spójnego systemu nagradzania sprawia, że motywowanie dziecka jest trudne i często sprowadza się do doraźnych działań.
    * Brak wglądu w postępy: Bez scentralizowanego systemu rodzic nie ma łatwego dostępu do informacji o systematyczności i terminowości dziecka.

## 3. Wymagania funkcjonalne
### 3.1. Moduł Zarządzania (Panel Rodzica)
* Uwierzytelnianie: Możliwość bezpiecznego logowania do panelu.
* Onboarding: Prosty, 3-etapowy przewodnik dla rodzica przy pierwszym logowaniu, ułatwiający konfigurację aplikacji.
* Zarządzanie Rutynami: Możliwość edycji ram czasowych dla trzech predefiniowanych rutyn (Poranna, Popołudniowa, Wieczorna).
* Zarządzanie Zadaniami: Pełen CRUD (Create, Read, Update, Delete) dla zadań w każdej rutynie, z możliwością przypisania nazwy, wartości punktowej i opcjonalnego opisu.
* Zarządzanie Nagrodami: Pełen CRUD dla nagród, z możliwością zdefiniowania nazwy i kosztu w punktach.
* Dashboard Postępów: Widok postępów dziecka w ujęciu dziennym, pokazujący status wykonania poszczególnych zadań i czas ukończenia rutyny. Panel umożliwia nawigację do poprzednich dni.
* Styl Interfejsu: Czysty, minimalistyczny i profesjonalny.

### 3.2. Moduł Użytkownika (Interfejs Dziecka)
* Ekran Główny: Widok trzech rutyn, z których tylko jedna jest aktywna w zależności od pory dnia. Pozostałe są wyszarzone.
* Interaktywna Lista Zadań z Podświetleniem: Po rozpoczęciu rutyny, na ekranie pojawia się pełna lista zadań. Zadania wykonane są oznaczone, zadanie aktualne jest wyraźnie podświetlone, a zadania przyszłe są widoczne, ale nieaktywne.
* Interakcja z Zadaniem: Możliwość oznaczenia aktualnie podświetlonego zadania jako wykonanego, co skutkuje jego wizualną zmianą i automatycznym podświetleniem kolejnego zadania na liście.
* Timer: Możliwość uruchomienia stopera na początku rutyny. Timer jest niezatrzymywalny i kończy pracę po ukończeniu rutyny lub upłynięciu jej okna czasowego.
* System Punktacji: Zdobywanie punktów za wykonane zadania. Pobicie rekordu czasowego w rutynie przyznaje podwójne punkty.
* Portfel Punktowy: Stale widoczny na ekranie licznik z sumą zgromadzonych punktów.
* Sklep z Nagrodami: Dostępny po kliknięciu w licznik punktów. Umożliwia przeglądanie nagród i wymianę punktów na nie po potwierdzeniu. Nagrody, na które dziecko nie ma wystarczającej liczby punktów, są nieaktywne.
* Profil i Osiągnięcia: Widok profilu z galerią zdobytych odznak za osiągnięcia.
* Styl Interfejsu: Angażujący, w stylu "gamingowym", z wykorzystaniem pasków postępu, ikon i animacji.

### 3.3. Wymagania Niefunkcjonalne
* Design: Aplikacja musi być zaprojektowana w podejściu "Mobile First" i być w pełni responsywna.
* Architektura: Baza danych i logika aplikacji muszą być przygotowane na przyszłą rozbudowę o obsługę wielu użytkowników (rodziców i dzieci).

## 4. Granice produktu
### 4.1. W Zasięgu MVP
* Pełna funkcjonalność Panelu Rodzica do zarządzania systemem dla jednego dziecka.
* Pełna funkcjonalność Interfejsu Dziecka do wykonywania zadań i zbierania nagród.
* System Osiągnięć z czterema predefiniowanymi odznakami.
* Podstawowy system uwierzytelniania dla rodzica.

### 4.2. Poza Zasięgiem MVP
* Mechanizm "Streaks" (serii dni z rzędu).
* System powiadomień (SMS, Push, e-mail).
* Zaawansowany widok historii w formie kalendarza.
* Obsługa wielu dzieci lub wielu rodziców w interfejsie użytkownika.
* Jakiekolwiek funkcje związane z płatnościami lub subskrypcjami.

## 5. Historyjki użytkowników
### 5.1. Uwierzytelnianie
* ID: US-001
* Tytuł: Logowanie rodzica
* Opis: Jako rodzic, chcę móc bezpiecznie zalogować się do swojego panelu, aby zarządzać aplikacją.
* Kryteria akceptacji:
    1.  Na stronie logowania znajdują się pola na login (e-mail) i hasło.
    2.  Po podaniu poprawnych danych i kliknięciu "Zaloguj", jestem przekierowywany do głównego dashboardu panelu rodzica.
    3.  Po podaniu niepoprawnych danych, wyświetlany jest komunikat o błędzie.

### 5.2. Onboarding
* ID: US-002
* Tytuł: Przewodnik po pierwszym logowaniu
* Opis: Jako rodzic, logując się po raz pierwszy, chcę zostać poprowadzony przez podstawową konfigurację aplikacji, abym mógł szybko zacząć z niej korzystać.
* Kryteria akceptacji:
    1.  Po pierwszym zalogowaniu wyświetla się okno powitalne.
    2.  System krok po kroku prosi o dodanie pierwszego zadania do rutyny porannej.
    3.  System krok po kroku prosi o stworzenie pierwszej nagrody.
    4.  Po ukończeniu przewodnika jestem przekierowywany do standardowego dashboardu.

### 5.3. Zarządzanie Zadaniami (Rodzic)
* ID: US-003
* Tytuł: Tworzenie nowego zadania
* Opis: Jako rodzic, chcę móc dodać nowe zadanie do wybranej rutyny, aby Eryk wiedział, co ma zrobić.
* Kryteria akceptacji:
    1.  W panelu rodzica istnieje przycisk "Dodaj zadanie".
    2.  Po kliknięciu mogę wybrać rutynę (Poranna, Popołudniowa, Wieczorna).
    3.  Mogę wpisać nazwę zadania, jego wartość punktową oraz opcjonalny opis.
    4.  Po zapisaniu, nowe zadanie jest widoczne na liście zadań w odpowiedniej rutynie.

* ID: US-004
* Tytuł: Edycja istniejącego zadania
* Opis: Jako rodzic, chcę móc edytować istniejące zadanie, aby zaktualizować jego szczegóły lub wartość punktową.
* Kryteria akceptacji:
    1.  Przy każdym zadaniu na liście znajduje się opcja "Edytuj".
    2.  Po jej wybraniu mogę zmienić nazwę, punkty i opis zadania.
    3.  Zapisane zmiany są od razu widoczne na liście zadań.

* ID: US-005
* Tytuł: Usuwanie zadania
* Opis: Jako rodzic, chcę móc usunąć zadanie, które nie jest już aktualne.
* Kryteria akceptacji:
    1.  Przy każdym zadaniu na liście znajduje się opcja "Usuń".
    2.  Po jej wybraniu wyświetla się okno z prośbą o potwierdzenie.
    3.  Po potwierdzeniu, zadanie znika z listy.

### 5.4. Zarządzanie Nagrodami (Rodzic)
* ID: US-006
* Tytuł: Tworzenie nowej nagrody
* Opis: Jako rodzic, chcę móc dodać nową nagrodę do sklepu, aby zmotywować Eryka do zbierania punktów.
* Kryteria akceptacji:
    1.  W sekcji "Nagrody" znajduje się przycisk "Dodaj nagrodę".
    2.  Mogę wpisać nazwę nagrody oraz jej koszt w punktach.
    3.  Po zapisaniu, nowa nagroda jest widoczna w sklepie.

* ID: US-007
* Tytuł: Edycja istniejącej nagrody
* Opis: Jako rodzic, chcę móc edytować istniejącą nagrodę, aby zmienić jej nazwę lub koszt.
* Kryteria akceptacji:
    1.  Przy każdej nagrodzie znajduje się opcja "Edytuj".
    2.  Po jej wybraniu mogę zmienić nazwę i koszt nagrody.
    3.  Zapisane zmiany są od razu widoczne w sklepie.

* ID: US-008
* Tytuł: Usuwanie nagrody
* Opis: Jako rodzic, chcę móc usunąć nagrodę, która nie jest już dostępna.
* Kryteria akceptacji:
    1.  Przy każdej nagrodzie znajduje się opcja "Usuń".
    2.  Po jej wybraniu wyświetla się okno z prośbą o potwierdzenie.
    3.  Po potwierdzeniu, nagroda znika ze sklepu.

### 5.5. Śledzenie Postępów (Rodzic)
* ID: US-009
* Tytuł: Przeglądanie postępów z bieżącego dnia
* Opis: Jako rodzic, chcę na głównym ekranie panelu widzieć podsumowanie postępów Eryka z dzisiejszego dnia, aby szybko zorientować się, co zostało zrobione.
* Kryteria akceptacji:
    1.  Dashboard domyślnie pokazuje dane z bieżącego dnia.
    2.  Widoczne są wszystkie trzy rutyny.
    3.  Przy każdej rutynie widoczna jest lista zadań ze statusem "wykonane" lub "niewykonane".
    4.  Jeśli rutyna została ukończona, widoczny jest czas jej wykonania.

* ID: US-010
* Tytuł: Przeglądanie historii postępów
* Opis: Jako rodzic, chcę móc przeglądać postępy Eryka z poprzednich dni, aby ocenić jego systematyczność.
* Kryteria akceptacji:
    1.  Na dashboardzie znajdują się przyciski nawigacyjne "< Poprzedni dzień" i "Następny dzień >".
    2.  Kliknięcie przycisku ładuje i wyświetla dane z odpowiedniego dnia.

### 5.6. Wykonywanie Zadań (Dziecko)
* ID: US-011
* Tytuł: Wyświetlanie listy zadań rutyny
* Opis: Jako Eryk, po rozpoczęciu rutyny, chcę widzieć całą listę zadań, abym wiedział, co mnie czeka, z wyraźnie zaznaczonym zadaniem, które mam wykonać teraz.
* Kryteria akceptacji:
    1.  Po kliknięciu "Start" na ekranie pojawia się cała lista zadań dla danej rutyny.
    2.  Pierwsze zadanie na liście jest wizualnie podświetlone jako "aktualne" i jest interaktywne.
    3.  Pozostałe zadania (przyszłe) są widoczne, ale wyszarzone i nie można ich kliknąć.
    4.  Zadania już wykonane (jeśli wrócimy do rutyny) są oznaczone jako ukończone.

* ID: US-012
* Tytuł: Interakcja z listą zadań
* Opis: Jako Eryk, chcę móc oznaczyć aktualne zadanie jako wykonane, aby zobaczyć postęp na liście i przejść do kolejnego zadania.
* Kryteria akceptacji:
    1.  Kliknięcie na podświetlone, aktualne zadanie oznacza je jako wykonane (np. przekreślenie, zmiana koloru).
    2.  Po oznaczeniu zadania, podświetlenie automatycznie przesuwa się na kolejne zadanie na liście, które staje się aktywne.
    3.  Poprzednie zadanie pozostaje na liście, ale jest trwale oznaczone jako ukończone.
    4.  Punkty za wykonane zadanie są doliczane do puli punktów z bieżącej sesji.

* ID: US-013
* Tytuł: Korzystanie z timera
* Opis: Jako Eryk, chcę móc uruchomić timer przed rozpoczęciem rutyny, aby spróbować pobić swój rekord i zdobyć dodatkowe punkty.
* Kryteria akceptacji:
    1.  Na ekranie aktywnej rutyny znajduje się przycisk "Start".
    2.  Po jego kliknięciu rozpoczyna się odliczanie czasu i podeświatlane jest pierwsze zadanie z listy jako aktywne.
    3.  Timera nie można zatrzymać ani zresetować.
    4.  Timer zatrzymuje się automatycznie po oznaczeniu ostatniego zadania w rutynie jako wykonanego.
    5.  Jeśli mój czas jest lepszy niż poprzedni najlepszy czas dla tej rutyny, otrzymuję podwójne punkty.

### 5.7. Zdobywanie Nagród (Dziecko)
* ID: US-014
* Tytuł: Sprawdzanie salda punktów
* Opis: Jako Eryk, chcę w każdej chwili widzieć, ile punktów już zebrałem, aby wiedzieć, ile brakuje mi do nagrody.
* Kryteria akceptacji:
    1.  W górnej części interfejsu znajduje się stale widoczny licznik z moją całkowitą liczbą punktów.
    2.  Licznik aktualizuje się po każdej ukończonej rutynie.

* ID: US-015
* Tytuł: Wymiana punktów na nagrodę
* Opis: Jako Eryk, chcę móc wymienić zebrane punkty na wybraną nagrodę ze sklepu.
* Kryteria akceptacji:
    1.  Kliknięcie w licznik punktów przenosi mnie do sklepu z nagrodami.
    2.  Nagrody, na które mnie nie stać, są wyszarzone.
    3.  Przy dostępnej nagrodzie znajduje się przycisk "Wymień".
    4.  Po kliknięciu przycisku pojawia się okno z prośbą o potwierdzenie.
    5.  Po potwierdzeniu, koszt nagrody jest odejmowany od mojego salda punktowego, a ja widzę komunikat o sukcesie.

### 5.8. Osiągnięcia (Dziecko)
* ID: US-016
* Tytuł: Zdobywanie osiągnięć
* Opis: Jako Eryk, chcę być nagradzany specjalnymi odznakami za osiągnięcie kamieni milowych w aplikacji.
* Kryteria akceptacji:
    1.  Po spełnieniu warunków danego osiągnięcia (np. zebranie 100 punktów) pojawia się powiadomienie o jego zdobyciu.
    2.  Zdobyta odznaka jest dodawana do mojej galerii w profilu.

* ID: US-017
* Tytuł: Przeglądanie zdobytych osiągnięć
* Opis: Jako Eryk, chcę móc zobaczyć wszystkie odznaki, które do tej pory zdobyłem.
* Kryteria akceptacji:
    1.  W aplikacji istnieje sekcja "Profil" lub "Osiągnięcia".
    2.  W tej sekcji widoczna jest galeria ze wszystkimi zdobytymi przeze mnie odznakami.

## 6. Metryki sukcesu
### 6.1. Metryki Zaangażowania Użytkownika (Eryk)
* Współczynnik ukończenia rutyn: Procent ukończonych rutyn w stosunku do wszystkich dostępnych w danym tygodniu. Cel: >80%.
* Czas wykonania rutyny: Średni czas potrzebny na ukończenie poszczególnych rutyn. Spadek tego czasu może świadczyć o rosnącej sprawności.
* Wykorzystanie nagród: Częstotliwość wymiany punktów na nagrody. Cel: co najmniej 1 nagroda na miesiąc.

### 6.2. Metryki Wartości dla Rodzica
* Regularność korzystania z panelu: Liczba logowań rodzica do panelu w tygodniu w celu sprawdzenia postępów. Cel: >3 logowania na tydzień.
* Wskaźnik retencji: Ciągłość korzystania z aplikacji przez okres dłuższy niż 1 miesiąc.
* Ocena jakościowa (subiektywna): Zmniejszenie przez rodzica potrzeby werbalnego przypominania o obowiązkach, co jest głównym celem biznesowym produktu.