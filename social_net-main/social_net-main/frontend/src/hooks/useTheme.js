import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '@/store/slices/uiSlice';

export function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector(state => state.ui.theme);

  const toggle = () => {
    dispatch(toggleTheme());
  };

  return { theme, toggleTheme: toggle };
}
