-- ============================================================
-- MIGRACIÓN: Ver predicciones de otros cuando está cerrado
-- Ejecuta en: Supabase → SQL Editor → New query
-- ============================================================

-- Predicciones de partido: visibles para todos cuando grupos está cerrado
create policy "Todos ven pred. partidos cuando cerrado"
  on public.match_predictions for select
  using (
    exists (
      select 1 from public.app_settings
      where key = 'group_predictions_open' and (value is null or value != 'true')
    )
  );

-- Predicciones de clasificados: visibles cuando grupos está cerrado
create policy "Todos ven pred. clasificados cuando cerrado"
  on public.group_qualify_predictions for select
  using (
    exists (
      select 1 from public.app_settings
      where key = 'group_predictions_open' and (value is null or value != 'true')
    )
  );

-- Predicciones eliminatorias: visibles cuando eliminatorias está cerrado
create policy "Todos ven pred. eliminatorias cuando cerrado"
  on public.knockout_predictions for select
  using (
    exists (
      select 1 from public.app_settings
      where key = 'knockout_predictions_open' and (value is null or value != 'true')
    )
  );

-- Predicciones premios: visibles cuando premios está cerrado
create policy "Todos ven pred. premios cuando cerrado"
  on public.award_predictions for select
  using (
    exists (
      select 1 from public.app_settings
      where key = 'awards_predictions_open' and (value is null or value != 'true')
    )
  );
