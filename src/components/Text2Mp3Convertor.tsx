import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box,
  Container,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Grid,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  Headphones,
  Save,
  Upload,
  PlayArrow,
  Download,
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00acc1',
    },
    secondary: {
      main: '#7c4dff',
    },
  },
});

const TextToMP3Converter: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [voice, setVoice] = useState<string>('en-US-BrianNeural');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = document.querySelector('audio');
      if (audio) {
        audio.load();
      }
    }
  }, [audioUrl]);

  const handleSubmit = async (downloadMode: boolean) => {
    if (!text) {
      alert('Please enter some text');
      return;
    }

    const endpoint = downloadMode ? 'https://speech.eligapris.com/convert-and-download' : 'https://speech.eligapris.com/convert-and-stream';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) throw new Error('Conversion failed');

      const blob = await response.blob();

      if (downloadMode) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'tts_output.mp3';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred during conversion.');
    }
  };

  const saveText = () => {
    const blob = new Blob([text], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text_to_convert.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadText = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      await loadPDF(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    }
  };

  const loadPDF = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://speech.eligapris.com/upload-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('PDF upload failed');
      }

      const result = await response.json();
      setText(result.text);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while loading the PDF.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Headphones sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" component="h1">
              Advanced Text to MP3 Converter
            </Typography>
          </Box>
          <Typography variant="body1" mb={2}>
            Type or paste your text directly into the editor below, or use the 'Load Text/PDF' button to upload a file.
          </Typography>
          <Box mb={3}>
            <ReactQuill
              ref={quillRef}
              value={text}
              onChange={setText}
              style={{ height: 200, marginBottom: 16 }}
              placeholder="Type or paste your text here, or load a file using the button below..."
            />
          </Box>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="voice-select-label">Voice</InputLabel>
                <Select
                  labelId="voice-select-label"
                  value={voice}
                  label="Voice"
                  onChange={(e) => setVoice(e.target.value)}
                >
                  <MenuItem value="en-US-BrianNeural">Brian (Male)</MenuItem>
                  <MenuItem value="en-US-JennyNeural">Jenny (Female)</MenuItem>
                  <MenuItem value="en-GB-RyanNeural">Ryan (Male, British)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={saveText}
              >
                Save Text
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={loadText}
                accept=".html,.txt,.pdf"
              />
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<Upload />}
                onClick={() => fileInputRef.current?.click()}
              >
                Load Text/PDF
              </Button>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => handleSubmit(false)}
              >
                Convert & Play
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<Download />}
                onClick={() => handleSubmit(true)}
              >
                Download MP3
              </Button>
            </Grid>
          </Grid>
          {audioUrl && (
            <Box mt={3}>
              <audio controls style={{ width: '100%' }}>
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default TextToMP3Converter;