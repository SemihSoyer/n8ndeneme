# n8n Custom Docker Image - Memory Optimized
# Base: Official n8n image
# Added: Python 3.11 + Excel/PDF libraries (staged installation)

FROM n8nio/n8n:latest

# Switch to root to install packages
USER root

# Install Python and system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    libffi-dev \
    openssl-dev \
    jpeg-dev \
    zlib-dev \
    freetype-dev

# Create symlinks for python/pip
RUN ln -sf /usr/bin/python3 /usr/bin/python && \
    ln -sf /usr/bin/pip3 /usr/bin/pip

# Install Python libraries ONE BY ONE to reduce memory usage
RUN pip3 install --no-cache-dir --break-system-packages openpyxl==3.1.2
RUN pip3 install --no-cache-dir --break-system-packages xlsxwriter==3.1.9
RUN pip3 install --no-cache-dir --break-system-packages reportlab==4.0.7
RUN pip3 install --no-cache-dir --break-system-packages fpdf2==2.7.6
RUN pip3 install --no-cache-dir --break-system-packages Pillow==10.1.0
RUN pip3 install --no-cache-dir --break-system-packages pandas==2.1.4

# Verify installations
RUN python3 --version && \
    python3 -c "import openpyxl; import reportlab; import pandas; print('✅ All libraries installed successfully!')"

# Switch back to n8n user
USER node

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV N8N_PYTHON_PATH=/usr/bin/python3

# Healthcheck (inherit from base image)
