import { useState } from 'react'
import { 
  Dialog, 
  DialogTitle, 
  DialogActions, 
  Button, 
  Box,
  Typography,
  CircularProgress
} from '@mui/material'
import { LogOut, AlertTriangle } from 'lucide-react'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1
            }}
          >
            <AlertTriangle color='white' />
          </Box>
          <Typography fontWeight="bold" color="text.primary">
            ログアウト確認
          </Typography>
          <Typography variant="body1" color="text.secondary">
            本当にログアウトしますか？
          </Typography>
        </Box>
      </DialogTitle>

      <DialogActions sx={{ 
        px: 3, 
        pb: 3, 
        gap: 2, 
        mx: 'auto', 
        mt: 4, 
        display: 'flex', 
        flexDirection: { xs: 'column-reverse', sm: 'row' }, 
        justifyContent: 'center',
        width: '100%'
      }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
          sx={{ 
            px: 4, 
            py: 2,
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: 120 }
          }}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          variant="contained"
          color='error'
          sx={{ 
            px: 4, 
            py: 2, 
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: 120 }
          }}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <LogOut />
            )
          }
        >
          {isLoading ? 'ログアウト中...' : 'ログアウト'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
